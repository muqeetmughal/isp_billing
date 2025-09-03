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

#get access token 
def get_stripe_secret_key():
    secret_ket = frappe.get_single("Isp Billing Setting")
    return secret_ket


"""
this code is used to get payment from customer automatically if customer is already register
"""
def stripe_direct_debit(amount, payment_method, customer_id):

    secret_key = get_stripe_secret_key()
    stripe.api_key = secret_key.get("stripe_secret_key")

    payment_intent = stripe.PaymentIntent.create(
        amount = amount,
        currency = "usd",
        # customer = "cus_SzBuKUZOIP8X2h",
        customer = customer_id,
        # payment_method = "pm_1S3EWxQN9Rybq9acWfpDrqSF",
        payment_method = payment_method,
        off_session=True,
        confirm=True,
        automatic_payment_methods={
            "enabled": True,
            "allow_redirects": "never",  # 🚀 important fix
        },
    )

    return("Payment Status:", payment_intent.status)




"""
create customer and payment_method for stripe
"""
def stripe_customer():

    secret_ket = get_stripe_secret_key()
    stripe.api_key = secret_ket.get("stripe_secret_key")

    customer_id = "cus_SzBuKUZOIP8X2h"

    payment_method = stripe.PaymentMethod.create(
        type="card",
        card={
            "number": "4242424242424242",
            "exp_month": 12,
            "exp_year": 2030,
            "cvc": "123",
        }
    )

    print("Payment Method Created:", payment_method.id)

    stripe.PaymentMethod.attach(
        payment_method.id,
        customer=customer_id
    )

    stripe.Customer.modify(
        customer_id,
        invoice_settings={
            "default_payment_method": payment_method.id
        }
    )

    print("✅ Payment method attached & set as default")

    return ("Payment Method Created Successfully")




# app_name/api/stripe_integration.py

import frappe
import stripe




@frappe.whitelist(allow_guest=True)
def create_customer_and_payment_method(email, name, payment_method_id):
    """
    Creates a Stripe Customer, attaches PaymentMethod, sets it as default.
    """

    secret_key = get_stripe_secret_key()

    stripe.api_key = secret_key.get("stripe_secret_key")
    try:
        # 1. Create Customer in Stripe
        customer = stripe.Customer.create(
            email=email,
            name=name,
        )

        # 2. Attach the payment method
        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=customer.id
        )

        # 3. Set default payment method
        stripe.Customer.modify(
            customer.id,
            invoice_settings={
                "default_payment_method": payment_method_id
            }
        )

        return {
            "status": "success",
            "customer_id": customer.id,
            "payment_method_id": payment_method_id
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Stripe Create Customer + PaymentMethod Error")
        return {"status": "error", "message": str(e)}







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










