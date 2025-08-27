import frappe
import gocardless_pro



#get access token 
def get_gocardless_access_token():
    access_token = frappe.get_single("Isp Billing Setting")
    return access_token




def gocardless_first():
    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")
    client = gocardless_pro.Client(
        access_token= token,
        environment='sandbox'
    )

    return client






@frappe.whitelist(allow_guest=True)
def gocardless_test():

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    client = gocardless_pro.Client(
        access_token=token,
        environment="sandbox",
    )

    customers = client.customers.list().records
    print("Customers" , customers)
    print("Customers email"  , [customer.email for customer in customers])
    print("Customer created_at" , [customer.created_at for customer in customers])
    print("Customer ID" , [customer.id for customer in customers])
    print("First Name" , [customer.given_name for customer in customers])

    customer_bank_account = client.customer_bank_accounts.list().records

    print("Customer Bank Account ID", [bank.id for bank in customer_bank_account])
    print("Customer Bank Account Holder Name", [bank.account_holder_name for bank in customer_bank_account])
    print("Customer Bank Name", [bank.bank_name for bank in customer_bank_account])

    mandates = client.mandates.list().records

    print("Mandate ID", [man.id for man in mandates])
    print("Status", [man.status for man in mandates])
    
    return {
        "message": "GoCardless client created successfully",
        "environment": client._environment_url
    }






#Create customer in GoCardless
def create_customer(first_name, last_name, email, address, city, postal_code, country_code):

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    # Initialize the GoCardless client
    client = gocardless_pro.Client(
        access_token=token,
        environment="sandbox" 
    )

    # Define customer parameters
    customer_params = {
        "given_name": "John",
        "family_name": "Doe",
        "email": "john.doe@example.com",
        "address_line1": "123 Main Street",
        "city": "London",
        "postal_code": "SW1A 0AA",
        "country_code": "GB",
        # Add other relevant fields as needed, e.g., company_name, phone_number
    }

    try:
        # Create the customer
        customer = client.customers.create(params=customer_params)
        print(f"Customer created successfully: {customer.id}")
        print(f"Customer details: {customer}")
    except gocardless_pro.errors.GoCardlessProError as e:
        print(f"Error creating customer: {e}")


    return {
        "success": True,
        "msg": "Customer created successfully"
    }





# Create Customer, customer mandate and bank details of customer
def create_customer_and_mandate(first_name, last_name, email, address, city, postal_code, country_code):

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    # Initialize the GoCardless client
    client = gocardless_pro.Client(
        access_token=token,
        environment="sandbox"
    )

    # Define customer parameters
    customer_params = {
        "given_name": first_name,
        "family_name": last_name,
        "email": email,
        "address_line1": address,
        "city": city,
        "postal_code": postal_code,
        "country_code": country_code,
    }

    try:
        # Step 1: Create the customer
        customer = client.customers.create(params=customer_params)
        print(f"✅ Customer created: {customer.id}")

        # Step 2: Create a customer bank account
        bank_account_params = {
            "account_holder_name": first_name + last_name,
            "account_number": "55779911",    # Test account number for sandbox
            "branch_code": "200000",         # Test UK sort code
            "country_code": "GB",
            "links": {
                "customer": customer.id
            }
        }

        bank_account = client.customer_bank_accounts.create(params=bank_account_params)
        print(f"✅ Bank account created: {bank_account.id}")

        # Step 3: Create a mandate linked to the bank account
        mandate_params = {
            "scheme": "bacs",  # UK direct debit scheme
            "links": {
                "customer_bank_account": bank_account.id
            }
        }

        mandate = client.mandates.create(params=mandate_params)
        print(f"✅ Mandate created: {mandate.id}")

        return {
            "success": True,
            "customer_id": customer.id,
            "bank_account_id": bank_account.id,
            "mandate_id": mandate.id,
            "msg": "Customer, bank account, and mandate created successfully"
        }

    except gocardless_pro.errors.GoCardlessProError as e:
        print(f"❌ Error: {e}")
        return {"success": False, "msg": str(e)}
    

    





# add subscription for specific mandate
def create_subscription(mandate_id: str):

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    # Initialize the GoCardless client
    client = gocardless_pro.Client(
        access_token=token,
        environment="sandbox"
    )

    try:
        # Define subscription parameters
        subscription_params = {
            "amount": 1000,  # Amount in pence (1000 = £10.00)
            "currency": "GBP",
            "name": "Monthly Subscription",
            "interval_unit": "monthly",  # daily, weekly, monthly, yearly
            "links": {
                "mandate": mandate_id  # Existing mandate ID
            },
            # Optional: specify start date
            # "start_date": "2025-09-01",
            # Optional: end date or number of payments
            # "count": 12   # e.g. run 12 times then stop
        }

        # Create the subscription
        subscription = client.subscriptions.create(params=subscription_params)

        print(f"✅ Subscription created: {subscription.id}")
        return {
            "success": True,
            "subscription_id": subscription.id,
            "msg": "Subscription created successfully"
        }

    except gocardless_pro.errors.GoCardlessProError as e:
        print(f"❌ Error creating subscription: {e}")
        return {"success": False, "msg": str(e)}








# invite customer link
def create_customer_invite_link(first_name, last_name, email):

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    client = gocardless_pro.Client(
        access_token=token,
        environment="sandbox"
    )

    redirect_flow = client.redirect_flows.create(params={
        "description": "CLI Secure Direct Debit Setup",
        "session_token": "unique_session_12345",   # must be unique per user
        "success_redirect_url": "http://localhost:8000/gocardless/success",
        "prefilled_customer": {
            "given_name": first_name,
            "family_name": last_name,
            "email": email
        }
    })

    # ✅ This is the link you are asking for
    invite_link = redirect_flow.redirect_url

    print("Send this link to the customer:", invite_link)
    return invite_link


def complete_redirect_flow(redirect_flow_id, session_token):

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    client = gocardless_pro.Client(
        access_token=token,
        environment="sandbox"
    )

    completed_flow = client.redirect_flows.complete(
        redirect_flow_id,
        params={"session_token": session_token}
    )

    # ✅ Now you get the mandate + customer ID
    mandate_id = completed_flow.links.mandate
    customer_id = completed_flow.links.customer

    print(f"✅ Mandate created: {mandate_id}, Customer: {customer_id}")
    return {
        "customer_id": customer_id,
        "mandate_id": mandate_id
    }









import frappe
import hmac
import hashlib
import json
import gocardless_pro

# GoCardless webhook secret (set in your GoCardless dashboard)
WEBHOOK_SECRET = "NZ2hC5AesymiNz-yYvKImTcTHkzOCFdX5pdoduUL"

@frappe.whitelist(allow_guest=True)
def gocardless_webhook():
    """
    Webhook endpoint for GoCardless.
    This will be called by GoCardless when events (like new customer created) happen.
    """

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")


    try:
        # Read request body
        payload = frappe.request.data.decode("utf-8")
        signature = frappe.get_request_header("Webhook-Signature")

        # ✅ Verify signature
        if not verify_webhook_signature(payload, signature):
            frappe.throw("Invalid Webhook Signature")

        data = json.loads(payload)

        # ✅ Loop through events
        for event in data.get("events", []):
            event_type = event.get("resource_type")
            action = event.get("action")

            if event_type == "customers":
                customer_id = event.get("links", {}).get("customer")

                # Fetch full customer details
                client = gocardless_pro.Client(
                    # access_token=frappe.db.get_single_value("GoCardless Settings", "access_token"),
                    access_token=token,
                    environment="sandbox"  # change to "live" in production
                )

                customer = client.customers.get(customer_id)

                frappe.logger().info(f"New Customer Created: {customer}")

                # Save customer in a custom Doctype (example: GoCardless Customer)
                doc = frappe.get_doc({
                    "doctype": "GoCardless Customer",
                    "customer_id": customer.id,
                    "email": customer.email,
                    "given_name": customer.given_name,
                    "family_name": customer.family_name
                })
                doc.insert(ignore_permissions=True)

            elif event_type == "mandates" and action == "created":
                mandate_id = event.get("links", {}).get("mandate")

                # Save mandate
                frappe.logger().info(f"New Mandate Created: {mandate_id}")

                doc = frappe.get_doc({
                    "doctype": "GoCardless Mandates",
                    "mandate_id": mandate_id,
                    "status": event.get("details", {}).get("cause", "pending")
                })
                doc.insert(ignore_permissions=True)

        return "Webhook received"

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "GoCardless Webhook Error")
        return "Error"


def verify_webhook_signature(payload, signature):
    """
    Verify GoCardless webhook signature
    """
    computed_signature = hmac.new(
        WEBHOOK_SECRET.encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(computed_signature, signature)
















#get customer details from mandate id 

def get_customer_from_mandate(mandate_id):
    """Fetch customer_id and email from GoCardless using mandate_id"""

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    try:

        # Initialize client
        client = gocardless_pro.Client(
            access_token=token,
            environment="sandbox"  # change to "live" in production
        )

        # Step 1: Get Mandate details
        mandate = client.mandates.get(mandate_id)
        customer_id = mandate.links.customer

        # Step 2: Get Customer details
        customer = client.customers.get(customer_id)

        return {
            "mandate_id": mandate.id,
            "customer_id": customer.id,
            "email": customer.email,
            "given_name": customer.given_name,
            "family_name": customer.family_name
        }

    except Exception as e:
        frappe.log_error(message=str(e), title="GoCardless Fetch Customer Error")
        return None
