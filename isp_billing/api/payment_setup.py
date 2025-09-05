import frappe
from frappe import _
from isp_billing.api.stripe import (create_payment_intent, create_stripe_checkout_link)







@frappe.whitelist(methods=["POST"], allow_guest=True)
def create_subscription_with_payment(customer, plan, amount, start_date, end_date):

    if not customer:
        frappe.local.response.http_status_code = 400
        return {"msg": _("Customer is required."), "success": False}

    if not plan:
        frappe.local.response.http_status_code = 400
        return {"msg": _("Subscription Plan is required."), "success": False}

    try:
        amount = float(amount)
    except Exception:
        frappe.local.response.http_status_code = 400
        return {"msg": _("Invalid amount format."), "success": False}

    try:
        payment_info = create_payment_intent(amount=amount) or {}
        client_secret = payment_info.get("client_secret")
        payment_intent_id = payment_info.get("payment_intent_id")

        enhancement_doc = frappe.new_doc("Subscription Enhancement")
        enhancement_doc.customer = customer
        enhancement_doc.start_date = start_date
        enhancement_doc.end_date = end_date
        enhancement_doc.stripe_client_id = client_secret
        enhancement_doc.stripe_payment_id = payment_intent_id
        enhancement_doc.status = "Pending"
        enhancement_doc.amount = amount


        if isinstance(plan, list):
            for p in plan:
                if not p.get("plan"):
                    continue
                enhancement_doc.append("subscription_plan", {
                    "plan": p.get("plan"),
                    "qty": p.get("qty", 1)
                })
        else:
            enhancement_doc.append("subscription_plan", {
                "plan": plan,
                "qty": 1
            })
        enhancement_doc.save(ignore_permissions=True)

        customer_doc = frappe.get_doc("Customer", customer)
        payment_details = create_stripe_checkout_link(amount, customer_doc.custom_email, enhancement_id=enhancement_doc.name)

        checkout_url = payment_details.get("checkout_url") if isinstance(payment_details, dict) else getattr(payment_details, "checkout_url", None)
        if not checkout_url:
            frappe.throw(_("Failed to retrieve checkout URL from Stripe."))

        enhancement_doc.payment_link = checkout_url
        
        enhancement_doc.save(ignore_permissions=True)

        frappe.db.commit()

        frappe.local.response.http_status_code = 201
        return {
            "msg": "Subscription enhancement created and payment initiated.",
            "subscription_enhancement": enhancement_doc.name,
            "payment_details": payment_details,
            "payment_intent": payment_info,
            "success": True
        }

    except Exception:
        frappe.log_error(message=frappe.get_traceback(), title="Subscription Enhancement creation failed")
        frappe.local.response.http_status_code = 500
        return {"msg": _("Failed to create subscription enhancement."), "success": False}



# Not complete yet
@frappe.whitelist(allow_guest=True)
def payment_success(enhancement_id):
    """
    Mark the Payment document as Paid where patient_appointment == appointment_id.
    """
    if not enhancement_id:
        frappe.local.response.http_status_code = 400
        return {
            "msg": "Appointment ID is required.",
            "success": False
        }

    try:

        # Load the document
        enhancement_doc = frappe.get_doc("Subscription Enhancement", enhancement_id)

        # Check if already paid
        if enhancement_doc.status == "Paid":
            frappe.local.response.http_status_code = 409
            return {
                "msg": "Payment is already Paid.",
                "success": False
            }

        # Update status
        enhancement_doc.status = "Paid"
        enhancement_doc.save(ignore_permissions=True)
        frappe.db.commit()

        frappe.local.response.http_status_code = 200
        return {
            "msg": "Payment paid successfully.",
            "success": True
        }

    except Exception as e:
        frappe.log_error(f"Error updating payment status: {e}")
        frappe.local.response.http_status_code = 500
        return {
            "msg": "An error occurred while updating payment status.",
            "success": False
        }



@frappe.whitelist(allow_guest=True)
def payment_cancelled(subscription_id):
    """
    If payment linked to appointment_id is not successful,
    mark it as Failed and delete both the Payment and Patient Appointment documents.
    """
    if not subscription_id:
        frappe.local.response.http_status_code = 400
        return {
            "msg": "Appointment ID is required.",
            "success": False
        }

    try:
        # Fetch the payment linked to the appointment
        payment = frappe.get_all(
            "Payment",
            filters={"subscription": subscription_id},
            fields=["name", "status"]
        )

        if not payment:
            frappe.local.response.http_status_code = 404
            return {
                "msg": "Payment record not found.",
                "success": False
            }

        payment_doc = frappe.get_doc("Payment", payment[0].name)

        # If payment is not successful (assuming not "Paid" or "Completed"), delete
        if payment_doc.status != "Paid":
            # Mark as Failed
            payment_doc.status = "Failed"
            payment_doc.save(ignore_permissions=True)

            # Delete Payment
            frappe.delete_doc("Payment", payment_doc.name, ignore_permissions=True)

            # Delete Patient Appointment
            frappe.delete_doc("Subscription", subscription_id, ignore_permissions=True)

            frappe.db.commit()

            frappe.local.response.http_status_code = 200
            return {
                "msg": "Payment marked as failed and both records deleted.",
                "success": True
            }
        else:
            frappe.local.response.http_status_code = 403
            return {
                "msg": "Payment is already successful. No action taken.",
                "success": False
            }

    except Exception as e:
        frappe.log_error(f"Error cancelling payment and appointment: {e}")
        frappe.local.response.http_status_code = 500
        return {
            "msg": "An error occurred while cancelling payment and appointment.",
            "success": False
        }






