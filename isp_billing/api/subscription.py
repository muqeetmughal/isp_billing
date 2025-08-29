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
        return("No subscription plans found.")
    
    return subscription_plans







@frappe.whitelist(allow_guest=True)
def create_sales_order_from_subscription_plan(subscription_plan_name, customer):
    # Fetch subscription plan details
    subscription_plan = frappe.get_doc("Subscription Plan", subscription_plan_name)

    if not subscription_plan:
        frappe.throw(f"Subscription Plan {subscription_plan_name} not found")

    # Create sales order document
    sales_order = frappe.new_doc("Sales Order")
    sales_order.customer = customer,
    sales_order.delivery_date = "2025-08-27"
    sales_order.custom_subscription_plan = subscription_plan_name

    # Set custom_subscription_plan field
    sales_order.custom_subscription_plan = subscription_plan.name

    # Add sales order item
    sales_order.append("items", {
        "item_code": subscription_plan.item,
        "qty": 1,
        "rate": subscription_plan.cost,
        "warehouse": "Stores - CS"
    })

    sales_order.insert(ignore_permissions=True)
    sales_order.submit()

    return sales_order.name




@frappe.whitelist(allow_guest=True)
def quotation_to_subscription(customer, plan, quotation, qty=1):

    doc = frappe.get_doc({
        "doctype": "Subscription",
        "party_type": "Customer",
        "party": customer,
        # "start_date": start_date,
        # "end_date": end_date,
        "start_date": "2025-08-21",
        "end_date": "2025-10-21",
        "custom_quotation": quotation
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






def add_customer_bank_detail(bank_name, account_name):
    
    doc = frappe.get_doc("Customer", "Suleman Saeed")

    doc.custom_bank_name = bank_name
    doc.custom_account_name = account_name
    doc.save(ignore_permissions=True)
    frappe.db.commit()
    frappe.local.response.http_status_code = 200
    return {
        "msg": "Bank details added successfully",
        "customer": doc.name,
        "success": True
    }






@frappe.whitelist(allow_guest=True)
def subscription_status():

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
        customer_email = frappe.db.get_value("Customer", customer, "custom_email")
        if customer_email:
            payment_email_template = frappe.get_doc("Email Template", "Payment Success")
            context = {
                "customer": customer,
                # "amount": amount,
                "enhancement_id": enhancement_id,
                }
            subject = frappe.render_template(payment_email_template.subject, context)
            message = frappe.render_template(payment_email_template.response, context)
            frappe.sendmail(
            recipients=[customer_email],
            subject=subject,
            message=message
            # subject="Payment Confirmation",
            # message=f"Dear {customer},<br>Your payment for enhancement {enhancement_id} has been received successfully."
            )

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














@frappe.whitelist(allow_guest=True)
def get_new_subscription_details(subscriber):
    Subscription = DocType("CLI Subscription")
    Service = DocType("Subscription Service")

    raw_data = (
        frappe.qb.from_(Subscription)
        .join(Service).on(Subscription.name == Service.parent)
        .select(
            Subscription.name,
            Subscription.customer,
            Service.plan,
            Service.quantity,
            Service.billing_start_date,
            Service.status,
            Service.price

        )
        .where(Subscription.name == subscriber)
        .run(as_dict=True)
    )

    subscriptions = {}
    for row in raw_data:
        sub_name = row["name"]
        customer = row["customer"]
        if sub_name not in subscriptions:
            subscriptions[sub_name] = {
                "name": sub_name,
                "customer": customer,
                "plans": []
            }

        subscriptions[sub_name]["plans"].append({
            "plan": row["plan"],
            "quantity": row["quantity"],
            "billing_start_date": row["billing_start_date"],
            "status": row["status"],
            "price": row["price"]
        })

    return list(subscriptions.values())






def invoice_status():

    Invoice = DocType("Sales Invoice")

    query = (
        frappe.qb.from_(Invoice)
        .select(
            Invoice.name,
            Invoice.customer,
            Invoice.status
        )
        .where(Invoice.name == "ACC-SINV-2025-00053")

    ).run(as_dict=True)

    return query


