import hmac
import json
import frappe
import hashlib
import gocardless_pro
from frappe.query_builder import DocType



#get access token 
def get_gocardless_access_token():
    access_token = frappe.get_single("Isp Billing Setting")
    return access_token





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


    subscription = client.subscriptions.list().records

    print("Subscription IDs", [sub.id for sub in subscription])
    
    return {
        "message": "GoCardless client created successfully",
        # "environment": client._environment_url
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




def get_subscriptions_by_mandate(mandate_id: str):
    """Fetch all subscriptions linked to a mandate"""
    try:
        access_token = get_gocardless_access_token()
        token = access_token.get("access_token")

        # Initialize GoCardless client
        client = gocardless_pro.Client(
            access_token=token,
            environment="sandbox"  # change to 'live' in production
        )

        # List subscriptions filtered by mandate
        subscriptions = client.subscriptions.list(params={
            "mandate": mandate_id
        }).records

        result = []
        for sub in subscriptions:
            result.append({
                "subscription_id": sub.id,
                "name": sub.name,
                "amount": sub.amount,
                "currency": sub.currency,
                "status": sub.status,
                "interval_unit": sub.interval_unit,
                "created_at": sub.created_at,
                "start_date": sub.start_date,
                "end_date": sub.end_date,
                "mandate_id": sub.links.mandate
            })

        return {
            "success": True,
            "count": len(result),
            "subscriptions": result
        }

    except gocardless_pro.errors.GoCardlessProError as e:
        frappe.log_error(f"GoCardless Error: {str(e)}", "GoCardless Subscription Fetch Error")
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







"""
this code is used in gocardless webhook
"""

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
            elif event_type == "payments" and action == "created":
                payment_id = event.get("links", {}).get("payment")

                # ✅ Get full payment details using your existing function
                payment_details = get_gocardless_payment_details(payment_id)

                frappe.logger().info(f"New Payment Created: {payment_details}")

                # ✅ Extract ERPNext Sales Invoice ID from metadata
                invoice_id = payment_details.get("invoice_detail", {}).get("erpnext_invoice")

                if invoice_id:
                    try:
                        # Fetch Sales Invoice
                        si = frappe.get_doc("Sales Invoice", invoice_id)

                        # Update custom fields
                        si.db_set("custom_gocardless_payment_id", payment_details.get("payment_id"))
                        si.db_set("custom_gocardless_payment_status", payment_details.get("status"))

                        frappe.logger().info(f"Updated Sales Invoice {invoice_id} with GoCardless payment details")

                    except Exception as e:
                        frappe.log_error(frappe.get_traceback(), f"Error updating Sales Invoice {invoice_id} with GoCardless Payment")

            elif event_type == "payments":
                payment_id = event.get("links", {}).get("payment")

                # ✅ Get latest payment details
                payment_details = get_gocardless_payment_details(payment_id)

                frappe.logger().info(f"Payment Event Received: {payment_details}")

                try:
                    # Find Sales Invoice using custom_gocardless_payment_id
                    si_name = frappe.db.get_value("Sales Invoice", {"custom_gocardless_payment_id": payment_id}, "name")
                    if si_name:
                        # ✅ 1) Always update status first
                        frappe.db.set_value("Sales Invoice", si_name, "custom_gocardless_payment_status", payment_details.get("status"))
                        frappe.logger().info(f"Updated Sales Invoice {si_name} status to {payment_details.get('status')}")

                        # ✅ 2) If status is "paid_out" → Create Payment Entry
                        if payment_details.get("status") == "paid_out":
                            si = frappe.get_doc("Sales Invoice", si_name)

                            # Avoid duplicate Payment Entries
                            existing_pe = frappe.db.exists(
                                "Payment Entry",
                                {
                                    "reference_no": payment_id,
                                    "party_type": "Customer",
                                    "party": si.customer
                                }
                            )

                            if not existing_pe:
                                pe = frappe.get_doc({
                                    "doctype": "Payment Entry",
                                    "payment_type": "Receive",
                                    "company": si.company,
                                    "posting_date": frappe.utils.nowdate(),
                                    "party_type": "Customer",
                                    "party": si.customer,
                                    # "paid_from": frappe.get_value("Company", si.company, "1310 - Debtors - CLI SECURE"),
                                    "paid_from": frappe.get_value("Company", si.company, "Debtors - CS"),
                                    # "paid_to": frappe.get_value("Company", si.company, "GoCardless-DIRECT DEBIT - GoCardless - CLI SECURE"),
                                    "paid_to": frappe.get_value("Company", si.company, "Cash - CS"),
                                    "paid_amount": si.outstanding_amount,
                                    "received_amount": si.outstanding_amount,
                                    "reference_no": payment_id,
                                    "reference_date": frappe.utils.nowdate(),
                                    "references": [{
                                        "reference_doctype": "Sales Invoice",
                                        "reference_name": si.name,
                                        "allocated_amount": si.outstanding_amount
                                    }]
                                })
                                pe.insert(ignore_permissions=True)
                                pe.submit()

                                frappe.logger().info(f"✅ Payment Entry {pe.name} created for Sales Invoice {si.name}")
                            else:
                                frappe.logger().info(f"ℹ️ Payment Entry already exists for Sales Invoice {si_name} and Payment {payment_id}")

                except Exception as e:
                    frappe.log_error(frappe.get_traceback(), f"Error handling Payment {payment_id}")


        return "Webhook received"

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "GoCardless Webhook Error")
        return "Error"


def verify_webhook_signature(payload, signature):
    """
    Verify GoCardless webhook signature
    """

    access_token = get_gocardless_access_token()
    token = access_token.get("webhook_secret")    


# GoCardless webhook secret (set in your GoCardless dashboard)
    WEBHOOK_SECRET = token

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
            environment="sandbox"
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




"""
if new customer is created in the gocardles and same customer is exists in the customer doctype with
same email then it will add mandate id in the customer document.
 """
def process_new_mandate(doc, method):
    """
    Runs when a new GoCardless Mandates doc is added
    """
    mandate_id = doc.mandate_id
    if not mandate_id:
        return

    # Step 1: Fetch customer details from GoCardless
    details = get_customer_from_mandate(mandate_id)
    if not details:
        return

    email = details.get("email")
    if not email:
        return 

    # Step 2: Find Customer with this email
    customer = frappe.get_value("Customer", {"custom_email": email}, "name")

    if customer:
        # Step 3: Update Customer with mandate id
        frappe.db.set_value("Customer", customer, "custom_gocardless_mandate_id", details.get("mandate_id"))
        frappe.db.commit()

    if not customer:
        return "No Customer exists with this email"









"""
this code is used to create invoice for subscription_plan in cli subscription
"""
@frappe.whitelist()
def create_invoices_for_subscription(subscription):

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    sub_doc = frappe.get_doc("CLI Subscription", subscription)

    if not sub_doc.customer:
        return("Customer is required in CLI Subscription")
    print(sub_doc.customer)

    # get customer doc to fetch mandate id
    customer_doc = frappe.get_doc("Customer", sub_doc.customer)
    mandate_id = customer_doc.custom_gocardless_mandate_id

    services = sub_doc.get("service") or []  

    created_invoices = []

    for svc in services:
        if svc.status != "Active":
            continue

        if svc.sales_invoice_id:
            continue

        # Fetch Subscription Plan to get item
        plan = frappe.get_doc("Subscription Plan", svc.plan)
        if not plan.item:
            return(f"No Item linked in Subscription Plan {svc.plan}")

        # Create Sales Invoice for this plan
        si = frappe.new_doc("Sales Invoice")
        si.customer = sub_doc.customer
        si.due_date = frappe.utils.nowdate()

        si.append("items", {
            "item_code": plan.item,
            "qty": svc.quantity,
            "rate": svc.price
        })

        si.insert(ignore_permissions=True)
        si.submit()
        created_invoices.append((si.name, plan.plan_name or plan.name))

        # 🔹 Save Sales Invoice ID in service row
        svc.sales_invoice_id = si.name

    # 🔹 Save subscription so child table updates
    sub_doc.save(ignore_permissions=True)

    return {"success": True, "created_invoices": created_invoices}






"""
Bulk generation of sales invoice for CLI Subscription Documents
"""

@frappe.whitelist()
def generate_invoices(subscription):
    try:
        result = create_invoices_for_subscription(subscription)
        return result
    except Exception as e:
        frappe.log_error(title="Invoice Generation Failed", message=frappe.get_traceback())
        return {"success": False, "error": str(e)}






"""
Create one off paymet in the gocardless
"""

@frappe.whitelist()

def create_one_off_payment(doc, method=None):
    """Create a one-off payment in GoCardless for a given Sales Invoice"""

    si = doc  # you already have the Sales Invoice doc from the trigger

    if not si.customer:
        frappe.throw("Customer is required in Sales Invoice")

    customer_doc = frappe.get_doc("Customer", si.customer)
    mandate_id = customer_doc.custom_gocardless_mandate_id
    if not mandate_id:
        frappe.throw(f"No GoCardless Mandate ID found for customer {si.customer}")

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    client = gocardless_pro.Client(
        access_token=token,
        environment="sandbox"
    )

    try:
        payment = client.payments.create(params={
            "amount": int(si.grand_total * 100),
            "currency": si.currency or "GBP",
            "links": {
                "mandate": mandate_id
            },
            "metadata": {
                "erpnext_invoice": si.name,
                "customer": si.customer
            }
        })

        frappe.msgprint(f"GoCardless One-Off Payment created: {payment.id}")
        return {"success": True, "payment_id": payment.id}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "GoCardless One-Off Payment Error")
        frappe.throw(f"GoCardless Payment Error: {str(e)}")






import frappe
import gocardless_pro
from frappe import _

@frappe.whitelist()
def create_one_sales_invoice_payment(invoice_name):
    """Create a one-off payment in GoCardless for a given Sales Invoice"""

    si = frappe.get_doc("Sales Invoice", invoice_name)

    if not si.customer:
        frappe.throw(_("Customer is required in Sales Invoice"))

    customer_doc = frappe.get_doc("Customer", si.customer)
    mandate_id = customer_doc.custom_gocardless_mandate_id
    if not mandate_id:
        frappe.throw(_(f"No GoCardless Mandate ID found for customer {si.customer}"))

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    client = gocardless_pro.Client(
        access_token=token,
        environment="sandbox"
    )

    try:
        payment = client.payments.create(params={
            "amount": int(si.grand_total * 100),
            "currency": si.currency or "GBP",
            "links": {
                "mandate": mandate_id
            },
            "metadata": {
                "erpnext_invoice": si.name,
                "customer": si.customer
            }
        })

        return {"success": True, "payment_id": payment.id}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "GoCardless One-Off Payment Error")
        frappe.throw(f"GoCardless Payment Error: {str(e)}")













import frappe

@frappe.whitelist()
def bulk_create_gocardless_payments(invoices):
    """
    Create GoCardless one-off payments for multiple Sales Invoices.
    invoices: list of Sales Invoice names
    """
    if isinstance(invoices, str):
        invoices = frappe.parse_json(invoices)

    results = []

    for inv in invoices:
        try:
            res = create_one_sales_invoice_payment(inv)
            results.append({
                "invoice": inv,
                "success": True,
                "payment_id": res.get("payment_id")
            })
        except Exception as e:
            frappe.log_error(frappe.get_traceback(), "GoCardless Bulk Payment Error")
            results.append({
                "invoice": inv,
                "success": False,
                "error": str(e)
            })

    return results













@frappe.whitelist()
def get_gocardless_payment_details(payment_id: str):
    """Fetch full payment details (with metadata, links, org details etc.) from GoCardless"""

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    try:

        client = gocardless_pro.Client(
            access_token=token,
            environment="sandbox"  # 🔹 change to 'live' in production
        )

        payment = client.payments.get(payment_id)

        # metadata = payment.metadata.erpnext_invoice
        mandate = payment.links.mandate
        creditor = payment.links.creditor
        incoive_detail = payment.metadata
     

        return {
            "payment_id": payment.id,
            "mandate": mandate,
            "creditor": creditor,
            "invoice_detail": incoive_detail,
            "status": payment.status
        
        }



    except Exception as e:
        return e

   




