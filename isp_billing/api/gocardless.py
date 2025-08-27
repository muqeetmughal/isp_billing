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
def create_customer():

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
def create_customer_and_mandate():

    access_token = get_gocardless_access_token()
    token = access_token.get("access_token")

    # Initialize the GoCardless client
    client = gocardless_pro.Client(
        access_token=token,
        environment="sandbox"
    )

    # Define customer parameters
    customer_params = {
        "given_name": "Zain",
        "family_name": "Malik",
        "email": "zain.malik@example.com",
        "address_line1": "123 Main Street",
        "city": "London",
        "postal_code": "SW1A 0AA",
        "country_code": "GB",
    }

    try:
        # Step 1: Create the customer
        customer = client.customers.create(params=customer_params)
        print(f"✅ Customer created: {customer.id}")

        # Step 2: Create a customer bank account
        bank_account_params = {
            "account_holder_name": "John Doe",
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














