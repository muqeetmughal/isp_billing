import frappe
import stripe
import json
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
    secret_key = frappe.get_single("Isp Billing Setting")
    return secret_key



def get_stripe_pubish_key():
    publish_key = frappe.get_single("Isp Billing Setting")
    return publish_key


"""
this code is used to get payment from customer automatically if customer is already register
"""

@frappe.whitelist(allow_guest=True)
def stripe_direct_debit_for_sales_invoice(sales_invoice_name):
    """
    Creates a Stripe PaymentIntent for a Sales Invoice using the linked
    Customer's Stripe details (customer_id + payment_method_id).
    """

    secret_key = get_stripe_secret_key()
    stripe.api_key = secret_key.get("stripe_secret_key")

    try:
        # 1. Get Sales Invoice
        si = frappe.get_doc("Sales Invoice", sales_invoice_name)

        # 2. Get linked Customer
        customer = frappe.get_doc("Customer", si.customer)

        # 3. Fetch Stripe IDs from Customer custom fields
        customer_id = customer.custom_stripe_customer_id
        payment_method = customer.custom_stripe_payment_method_id

        if not customer_id or not payment_method:
            frappe.throw("Stripe Customer ID or Payment Method ID is missing for this Customer.")

        # 4. Amount from Sales Invoice (convert to cents for Stripe)
        amount = int(si.outstanding_amount * 100)  # Stripe expects amount in cents

        # 5. Create PaymentIntent
        payment_intent = stripe.PaymentIntent.create(
            amount=amount,
            currency="usd",
            customer=customer_id,
            payment_method=payment_method,
            off_session=True,
            confirm=True,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never",
            },
        )

        # ✅ 6. Update Sales Invoice with PaymentIntent details
        si.db_set("custom_stripe_payment_id", payment_intent.id)
        si.db_set("custom_stripe_payment_status", payment_intent.status)

        return {
            "status": "success",
            "payment_status": payment_intent.status,
            "payment_intent_id": payment_intent.id
        }

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Stripe Direct Debit for Sales Invoice Error")
        return {"status": "error", "message": str(e)}






"""
This code is used in the stripe webhook to update the status of specific sales_invoice field
custom_stirpe_payment_status
"""
@frappe.whitelist(allow_guest=True)
def stripe_webhook():
    """
    Stripe webhook to update Sales Invoice payment status
    based on Stripe PaymentIntent events.
    """

    # Get Stripe settings
    secret_key = get_stripe_secret_key()
    stripe.api_key = secret_key.get("stripe_secret_key")

    # Your webhook signing secret stored in a DocType
    # endpoint_secret = frappe.db.get_single_value("Stripe Settings", "webhook_secret")
    endpoint_secret = ""

    payload = frappe.request.data
    sig_header = frappe.get_request_header("Stripe-Signature")

    event = None

    # Verify webhook
    try:
        if endpoint_secret:
            event = stripe.Webhook.construct_event(
                payload, sig_header, endpoint_secret
            )
        else:
            event = json.loads(payload)
    except ValueError as e:
        frappe.log_error(str(e), "⚠️ Webhook JSON Parse Error")
        frappe.local.response["http_status_code"] = 400
        return "Invalid payload"
    except stripe.error.SignatureVerificationError as e:
        frappe.log_error(str(e), "⚠️ Webhook Signature Verification Failed")
        frappe.local.response["http_status_code"] = 400
        return "Invalid signature"

    # --- Handle events ---
    if event and event["type"] in [
        "payment_intent.succeeded",
        "payment_intent.processing",
        "payment_intent.payment_failed"
    ]:
        payment_intent = event["data"]["object"]
        payment_intent_id = payment_intent.get("id")
        status = payment_intent.get("status")

        # Find Sales Invoice where custom_stripe_payment_id = payment_intent.id
        sales_invoice = frappe.db.get_value(
            "Sales Invoice",
            {"custom_stripe_payment_id": payment_intent_id},
            "name"
        )

        if sales_invoice:
            frappe.db.set_value(
                "Sales Invoice",
                sales_invoice,
                "custom_stripe_payment_status",
                status
            )
            frappe.db.commit()
            frappe.logger().info(f"✅ Updated {sales_invoice} with Stripe status: {status}")
        else:
            frappe.logger().warning(
                f"⚠️ No Sales Invoice found for PaymentIntent {payment_intent_id}"
            )

    else:
        frappe.logger().info(f"Unhandled event type {event['type']}")

    return "Webhook processed"





""""
This code is used to create customer and paymet_method in the stripe
"""
@frappe.whitelist(allow_guest=True)
def create_customer_and_payment_method(email, name, payment_method_id):
    """
    Creates a Stripe Customer, attaches PaymentMethod, sets it as default,
    and updates the corresponding Frappe Customer record.
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

        # 4. Update Frappe Customer (where custom_email = email)
        frappe.db.set_value(
            "Customer",
            {"custom_email": email},  # filter condition
            {
                "custom_stripe_customer_id": customer.id,
                "custom_stripe_payment_method_id": payment_method_id,
            },
        )

        frappe.db.commit()  # ensure the update is saved

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










