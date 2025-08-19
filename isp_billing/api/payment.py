import frappe
import stripe
from frappe import _

def get_stripe_client():
    """Initialize Stripe with the secret key from Virtual Hospital Setting"""
    settings = frappe.get_single("Isp Billing Setting")

    if not settings or not settings.stripe_secret_key or not settings.stripe_publish_key:
        return None  # Clearly return None if any key is missing
    
    stripe.api_key = settings.stripe_secret_key
    return stripe


@frappe.whitelist(allow_guest=True)
def get_stripe_publish_key():
    """Return the Stripe publishable key from Virtual Hospital Setting"""
    try:
        settings = frappe.get_single("Isp Billing Setting")
        if not settings.stripe_publish_key:
            frappe.local.response["http_status_code"] = 500
            return {
                "error": "Stripe publish key not found.",
                "status": "stripe key error",
            }
        return {"stripe_publish_key": settings.stripe_publish_key}
    except Exception:
        frappe.log_error(title="get_stripe_publish_key Error", message=frappe.get_traceback())
        frappe.local.response["http_status_code"] = 500
        return {"error": "Internal Server Error"}


@frappe.whitelist(allow_guest=True)
def create_payment_intent(amount:int, currency:str="usd"):
    """Create a Stripe PaymentIntent, store details in 'Payment' Doctype, and return client secret"""
    try:
        stripe_client = get_stripe_client()
        if not stripe_client:
            frappe.local.response.http_status_code = 400
            return {
                "msg": "Stripe Keys are not avsilable",
                "success": False
            }
        amount_in_cents = int(float(amount) * 100)  # Convert to cents

        intent = stripe_client.PaymentIntent.create(
            amount=amount_in_cents,
            currency=currency,
            # payment_method="pm_card_visa",
            payment_method_types=["card"]
        )

        frappe.local.response.http_status_code = 201
        return {
            "msg":"Stripe Client Created Successfully",
            "client_secret": intent.client_secret,
            "payment_intent_id": intent.id,
            "status": intent.status,
            "success": True
        }

    except Exception as e:
        frappe.log_error(f"Stripe Payment Error: {e}")
        frappe.local.response.http_status_code = 400
        return {
            "msg":"Unable to create payment. Please try again.",
            "success": False
            }



@frappe.whitelist(allow_guest=True)
def confirm_payment(payment_intent_id):
    """Optionally confirm a Stripe PaymentIntent (usually handled by frontend)"""
    try:
        stripe_client = get_stripe_client()
        intent = stripe_client.PaymentIntent.retrieve(payment_intent_id)
        confirmed_intent = intent.confirm()

        frappe.local.response.http_status_code = 201

        return {
            "msg":"Payment confirm successfully",
            "status": confirmed_intent.status,
            "success": True
            }

    except Exception as e:
        frappe.log_error(f"Stripe Confirmation Error: {e}")
        frappe.local.response.http_status_code = 400
        return{
            "msg":"Payment confirmation failed.",
            "success": False
            }



@frappe.whitelist(allow_guest=True)
def create_stripe_checkout_link(amount, customer_email, enhancement_id):
    try:
        stripe_client = get_stripe_client()

        # Use fixed URLs
        # success_url = "http://localhost:8080/frontend/success/{`enhancement_id`}"
        # cancel_url = "http://localhost:8080/frontend/cancel/{enhancement_id}"

        success_url = f"http://localhost:8080/frontend/success/{enhancement_id}"
        cancel_url = f"http://localhost:8080/frontend/cancel/{enhancement_id}"


        # Create Stripe Checkout Session
        session = stripe_client.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'usd',
                    'product_data': {
                        'name': f'{enhancement_id}',
                    },
                    'unit_amount': int(float(amount) * 100),  # amount in cents
                },
                'quantity': 1,
            }],
            mode='payment',
            customer_email=customer_email,
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                f"{enhancement_id}_id": enhancement_id
            }
        )

        return {
            "checkout_url": session.url,
            "session_id": session.id,
            "success": True
        }

    except Exception as e:
        frappe.log_error(f"Stripe Checkout creation failed for {enhancement_id}: {e}")
        frappe.local.response.http_status_code = 500
        return {
            "msg": _(f"Failed to create Stripe Checkout for {enhancement_id}."),
            "success": False
        }





def on_update(doc, method):
    if doc.status == "Paid":
        customer_email = frappe.db.get_value("Customer", doc.customer, "custom_email")
        if customer_email:
            frappe.sendmail(
                recipients=customer_email,
                subject="Payment Confirmation",
                message=f"Dear {doc.customer},<br>Your payment {doc.name} has been received successfully."
            )







@frappe.whitelist(allow_guest=True)
def add_plan_in_subscription(party, plan,start_date, end_date, qty):

    doc = frappe.get_doc({
        "doctype": "Subscription",
        "party_type": "Customer",
        "party": party,
        "start_date": start_date,
        "end_date": end_date,
        "status": "Actice"
    })
    
    doc.append("plans", {
        "plan": plan,
        "qty": qty
    })
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    frappe.local.response.http_status_code = 201
    return {
        "msg": "Plan added successfully",
        "subscription": doc.name,
        "success": True
    }










