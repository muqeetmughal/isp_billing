import json
import frappe
from frappe.query_builder import DocType


@frappe.whitelist()
# def get_subscription_details(email):

#     Subscription = DocType("Subscription")
#     Customer = DocType("Customer")
#     SubscriptionPlanDetail = DocType("Subscription Plan Detail")
    
#     subscription_details = (
#         frappe.qb.from_(Subscription)
#             .join(Customer)
#             .on(Subscription.party == Customer.name)
#             .join(SubscriptionPlanDetail)
#             .on(Subscription.name == SubscriptionPlanDetail.parent)
#             .select(Subscription.name, 
#                 Subscription.party_type, 
#                 Subscription.party,
#                 Subscription.status,
#                 SubscriptionPlanDetail.plan,
#                 SubscriptionPlanDetail.qty
#             )
#             .where(Customer.custom_email == email)
        
#     ).run(as_dict=True)
    
#     return subscription_details

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





# @frappe.whitelist(allow_guest=True)
# def create_subscription_from_plan(customer, plan_details):
#     """
#     Creates a new Subscription with child table entries from given plan details.

#     Args:
#         customer (str): The Customer ID.
#         plan_details (list): A list of dicts, each with 'plan' and 'qty' keys.

#     Example:
#         plan_details = [
#             {"plan": "Gold Plan", "qty": 2},
#             {"plan": "Silver Plan", "qty": 1}
#         ]
#     """

#     subscription = frappe.get_doc({
#         "doctype": "Subscription",
#         "party_type": "Customer",
#         "party": customer,
#         "status": "Active",
#         "plans": [
#             {
#                 "plan": d["plan"],
#                 "qty": d["qty"]
#             } for d in plan_details
#         ]
#     })

#     subscription.insert(ignore_permissions=True)
#     frappe.db.commit()
#     return subscription.name



def create_subscription(customer, plan_details):
    subscription = frappe.get_doc({
        "doctype": "Subscription",
        "party_type": "Customer",
        "party": customer,
        "status": "Active",
        "plans": [
            {"plan": d["plan"], "qty": d["qty"]} for d in plan_details
        ]
    })
    subscription.insert(ignore_permissions=True)
    frappe.db.commit()
    return subscription.name

def create_subscription_from_plan(customer, plan_details):
    return create_subscription(customer, plan_details)

@frappe.whitelist()
def create_subscription_from_plan_api(customer, plan_details):
    if isinstance(plan_details, str):
        plan_details = json.loads(plan_details)
    return create_subscription(customer, plan_details)
