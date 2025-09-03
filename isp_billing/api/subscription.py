import json
import frappe
from frappe.query_builder import DocType



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
            Service.price,
            Service.description,
            Service.no_of_month,
            Service.pay_period,
            Service.unit,
            Service.service_start_date,
            Service.cli,
            Service.location,
            Service.router,
            Service.service_login,
            Service.service_password,
            Service.ipv4_assignment_method

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
            "price": row["price"],
            "description": row["description"],
            "no_of_month": row["no_of_month"],
            "pay_period": row["pay_period"],
            "location": row["location"],
            "router": row["router"],
            "service_login": row["service_login"],
            "service_password": row["service_password"],
            "ipv4_assignment_method": row["ipv4_assignment_method"]
        })

    return list(subscriptions.values())








def cli_subscription_list():
    CLI_Subscription = DocType("CLI Subscription")

    query = ( frappe.qb.from_(CLI_Subscription) .select( CLI_Subscription.name ) ).run(as_dict=True)

    return query



def get_subscription_invoice(subscriber):
    Subscription = DocType("CLI Subscription")
    Service = DocType("Subscription Service")

    raw_data = (
        frappe.qb.from_(Subscription)
        .join(Service).on(Subscription.name == Service.parent)
        .select(
            Subscription.name,
            Subscription.customer,
            Service.plan,
            Service.sales_invoice_id

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
            "sales_invoice_id": row["sales_invoice_id"]
        })

    return list(subscriptions.values())
