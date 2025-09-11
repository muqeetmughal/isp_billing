# Copyright (c) 2025, MSS and contributors
# For license information, please see license.txt

# import frappe


# def execute(filters=None):
# 	columns, data = [], []
# 	return columns, data




import frappe

def execute(filters=None):
    # columns
    columns = [
        {"label": "Customer", "fieldname": "name", "fieldtype": "Link", "options": "Customer", "width": 200},
        {"label": "GoCardless Mandate ID", "fieldname": "custom_gocardless_mandate_id", "fieldtype": "Data", "width": 250},
        {"label": "Stripe Payment Method ID", "fieldname": "custom_stripe_payment_method_id", "fieldtype": "Data", "width": 250},
    ]

    # data
    data = frappe.get_all(
        "Customer",
        filters={
            "custom_stripe_payment_method_id": ["!=", ""],
            "custom_gocardless_mandate_id": ["!=", ""]
        },
        fields=["name", "custom_gocardless_mandate_id", "custom_stripe_payment_method_id"]
    )

    return columns, data
