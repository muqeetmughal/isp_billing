import json
import frappe
from frappe.query_builder import DocType


@frappe.whitelist()
def get_subscription_details(email):
    Subscription = DocType("Subscription")
    Customer = DocType("Customer")
    SubscriptionPlanDetail = DocType("Subscription Plan Detail")

    raw_data = (
        frappe.qb.from_(Subscription)
            .join(Customer).on(Subscription.party == Customer.name)
            .join(SubscriptionPlanDetail).on(Subscription.name == SubscriptionPlanDetail.parent)
            .select(
                Subscription.name,
                Subscription.party_type,
                Subscription.party,
                Subscription.status,
                SubscriptionPlanDetail.plan,
                SubscriptionPlanDetail.qty
            )
            .where(Customer.custom_email == email)
            .run(as_dict=True)
    )

    subscriptions = {}
    for row in raw_data:
        sub_name = row["name"]
        if sub_name not in subscriptions:
            subscriptions[sub_name] = {
                "name": sub_name,
                "party_type": row["party_type"],
                "party": row["party"],
                "status": row["status"],
                "plans": []
            }

        subscriptions[sub_name]["plans"].append({
            "plan": row["plan"],
            "qty": row["qty"]
        })

    return list(subscriptions.values())




@frappe.whitelist(allow_guest=True)
def get_subscription_plans():
    
    SubscriptionPlan = DocType("Subscription Plan")
    
    # Query the Subscription Plan doctype to get all plans
    subscription_plans = (
        frappe.qb.from_(SubscriptionPlan)
        .select(SubscriptionPlan.name,
                SubscriptionPlan.plan_name, 
                SubscriptionPlan.item,
                SubscriptionPlan.price_determination,
                SubscriptionPlan.currency,
                SubscriptionPlan.cost,)
    ).run(as_dict=True)
    
    if not subscription_plans:
        frappe.throw("No subscription plans found.")
    
    return subscription_plans



@frappe.whitelist(allow_guest=True)
def sub_status():

    doc = frappe.get_doc("Subscription", "ACC-SUB-2025-00008")

    doc.status = "Completed"

    doc.save(ignore_permissions=True)
    frappe.db.commit()
    frappe.local.response.http_status_code = 200
    return {
        "msg": "Subscription status updated successfully",
        "subscription": doc.name,
        "success": True
    }




def create_subscription(customer, start_date, end_date, plan_details):
    subscription = frappe.get_doc({
        "doctype": "Subscription",
        "party_type": "Customer",
        "party": customer,
        "status": "Active",
        "start_date": start_date,
        "end_date": end_date,
        "plans": [
            {"plan": d["plan"], "qty": d["qty"]} for d in plan_details
        ]
    })
    subscription.insert(ignore_permissions=True)
    frappe.db.commit()
    return subscription.name

def create_subscription_from_plan(customer, start_date, end_date, plan_details):
    return create_subscription(customer, start_date, end_date, plan_details)

@frappe.whitelist()
def create_subscription_from_plan_api(customer, start_date, end_date, plan_details):
    if isinstance(plan_details, str):
        plan_details = json.loads(plan_details)
    return create_subscription(customer, start_date, end_date, plan_details)












@frappe.whitelist(allow_guest=True)
def send_subscription_email(enhancement_id):

    # get Subscription Enhancement doc
    doc = frappe.get_doc("Subscription Enhancement", enhancement_id)

    # get customer email
    customer_email = frappe.db.get_value("Customer", doc.customer, "custom_email")

    if not customer_email:
        return(f"No custom_email found for Customer {doc.customer}")

    if not doc.payment_link:
        return(f"No payment_link found in Subscription Enhancement {enhancement_id}")

    # prepare the message
    subject = "Your Subscription Payment Link"
    message = f"""
    Hello,<br><br>
    Please complete your payment using the link below:<br>
    <a href="{doc.payment_link}">{doc.payment_link}</a><br><br>
    Thank you!
    """

    # send email
    frappe.sendmail(
        recipients=[customer_email],
        subject=subject,
        message=message
    )
    frappe.local.response.http_status_code = 200
    return {
        "msg": "Email sent successfully",
        "success": True
    }


















@frappe.whitelist(allow_guest=True)
def payment_success(enhancement_id):
    """
    Mark the Subscription Enhancement as Paid, 
    fetch its details, and create a Subscription.
    """
    if not enhancement_id:
        frappe.local.response.http_status_code = 400
        return {
            "msg": "Enhancement ID is required.",
            "success": False
        }

    try:
        # Load the document
        enhancement_doc = frappe.get_doc("Subscription Enhancement", enhancement_id)

        # Check if already paid
        if enhancement_doc.status == "Paid":
            frappe.local.response.http_status_code = 409
            return {
                "msg": "Payment is already marked as Paid.",
                "success": False
            }


        enhancement_doc.db_set("status", "Paid")

        # ✅ Fetch enhancement details
        enhancements = get_subscription_enhancement(enhancement_id)

        # If no enhancement found, stop here
        if not enhancements:
            frappe.local.response.http_status_code = 404
            return {
                "msg": "Enhancement details not found.",
                "success": False
            }

        created_subscriptions = []
        for enhancement in enhancements:
            customer = enhancement["customer"]
            start_date = enhancement["start_date"]
            end_date = enhancement["end_date"]

            for plan in enhancement["plans"]:
                # ✅ Create Subscription using plan details
                result = add_plan_in_subscription(
                    party=customer,
                    plan=plan["plan"],
                    start_date=start_date,
                    end_date=end_date,
                    qty=plan["qty"]
                )
                created_subscriptions.append(result["subscription"])

        frappe.local.response.http_status_code = 200
        return {
            "msg": "Payment marked as Paid and Subscription(s) created successfully.",
            "subscriptions": created_subscriptions,
            "success": True
        }

    except Exception as e:
        frappe.log_error(f"Error in payment_success: {e}")
        frappe.local.response.http_status_code = 500
        return {
            "msg": "An error occurred while processing payment.",
            "success": False
        }


# def payment_success(enhancement_id):
    
#     if not enhancement_id:
#         frappe.local.response.http_status_code = 400
#         return {
#             "msg": "Enhancement ID is required.",
#             "success": False
#         }

#     try:
#         # Load the document
#         enhancement_doc = frappe.get_doc("Subscription Enhancement", enhancement_id)

#         # Check if already paid
#         if enhancement_doc.status == "Paid":
#             frappe.local.response.http_status_code = 409
#             return {
#                 "msg": "Payment is already marked as Paid.",
#                 "success": False
#             }

#         # Mark as Paid
#         enhancement_doc.db_set("status", "Paid")

#         # ✅ Fetch enhancement details
#         enhancements = get_subscription_enhancement(enhancement_id)

#         if not enhancements:
#             frappe.local.response.http_status_code = 404
#             return {
#                 "msg": "Enhancement details not found.",
#                 "success": False
#             }

#         created_subscriptions = []
#         created_invoices = []

#         for enhancement in enhancements:
#             customer = enhancement["customer"]
#             start_date = enhancement["start_date"]
#             end_date = enhancement["end_date"]

#             for plan in enhancement["plans"]:
#                 result = add_plan_in_subscription(
#                     party=customer,
#                     plan=plan["plan"],
#                     start_date=start_date,
#                     end_date=end_date,
#                     qty=plan["qty"]
#                 )
#                 subscription_name = result["subscription"]
#                 created_subscriptions.append(subscription_name)

#                 # ✅ Load the created subscription
#                 subscription_doc = frappe.get_doc("Subscription", subscription_name)

#                 # Ensure subscription is saved before invoice
#                 subscription_doc.save(ignore_permissions=True)

#                 # ✅ Use Subscription’s built-in method to create invoice
#                 if hasattr(subscription_doc, "create_invoice"):
#                     invoice = subscription_doc.create_invoice()
#                     invoice.name = None
#                     invoice.insert(ignore_permissions=True)
#                     invoice.submit()
#                     # created_invoices.append(invoice.name)
#                 else:
#                     frappe.log_error(
#                         f"Subscription {subscription_name} has no create_invoice method."
#                     )

#         frappe.local.response.http_status_code = 200
#         return {
#             "msg": "Payment marked as Paid, Subscriptions and Invoices created successfully.",
#             "subscriptions": created_subscriptions,
#             "invoices": created_invoices,
#             "success": True
#         }

#     except Exception as e:
#         frappe.log_error(f"Error in payment_success: {frappe.get_traceback()}")
#         frappe.local.response.http_status_code = 500
#         return {
#             "msg": "An error occurred while processing payment.",
#             "success": False
#         }



def get_subscription_enhancement(enhancement_id):
    SubscriptionEnhancement = DocType("Subscription Enhancement")
    SubscriptionPlanDetail = DocType("Subscription Plan Detail")

    enhancements = (
        frappe.qb.from_(SubscriptionEnhancement)
            .join(SubscriptionPlanDetail).on(SubscriptionEnhancement.name == SubscriptionPlanDetail.parent)
            .select(
                SubscriptionEnhancement.name,
                SubscriptionEnhancement.customer,
                SubscriptionEnhancement.start_date,
                SubscriptionEnhancement.end_date,
                SubscriptionEnhancement.status,
                SubscriptionEnhancement.amount,
                SubscriptionEnhancement.payment_link,
                SubscriptionPlanDetail.plan,
                SubscriptionPlanDetail.qty
            )
            .where(SubscriptionEnhancement.name == enhancement_id)
            .run(as_dict=True)
    )

    subscription_enhancement = {}
    for row in enhancements:
        enhancement_name = row["name"]
        if enhancement_name not in subscription_enhancement:
            subscription_enhancement[enhancement_name] = {
                "name": enhancement_name,
                "customer": row["customer"],
                "status": row["status"],
                "start_date": row["start_date"],
                "end_date": row["end_date"],
                "amount": row["amount"],
                "payment_link": row["payment_link"],
                "plans": []
            }

        subscription_enhancement[enhancement_name]["plans"].append({
            "plan": row["plan"],
            "qty": row["qty"]
        })

    return list(subscription_enhancement.values())


def add_plan_in_subscription(party, plan, start_date, end_date, qty):
    doc = frappe.get_doc({
        "doctype": "Subscription",
        "party_type": "Customer",
        "party": party,
        "start_date": start_date,
        "end_date": end_date,
        "status": "Active"
    })

    doc.append("plans", {
        "plan": plan,
        "qty": qty
    })
    doc.save(ignore_permissions=True)
    frappe.db.commit()

    return {
        "msg": "Plan added successfully",
        "subscription": doc.name,
        "success": True
    }



