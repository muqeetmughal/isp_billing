import frappe
from frappe.query_builder import DocType




@frappe.whitelist(allow_guest=True)
def create_lead(name, pipline_status, partner, location, city, email, billing_email, mobile_no, street, zip_code, date_added, billing_type, score):

    doc = frappe.get_doc({
        "doctype": "Lead",
        "first_name": name,
        "custom_pipeline_status": pipline_status,
        "custom_partner": partner,
        "custom_location": location,
        "custom_city": city,
        "email_id": email,
        "custom_billing_email": billing_email,
        "mobile_no": mobile_no,
        "custom_street": street,
        "custom_zip_code": zip_code,
        "custom_date_added": date_added,
        "custom_billing_type": billing_type,
        "custom_score": score,
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    frappe.local.response.http_status_code = 201
    return {
        "msg": "Lead Created Successfully",
        "lead": doc.name,
        "success": True
    }




def get_customer():
    Customer = DocType("Customer")
    
    customers = (
        frappe.qb.from_(Customer)
            .select(
                Customer.name,
                Customer.customer_name, 
                Customer.custom_email,
                Customer.custom_mobile_no,
                Customer.custom_billing_email,
                Customer.custom_partner,
                Customer.custom_billing_type,
                Customer.custom_city,
                Customer.custom_portal_login,
                Customer.custom_portal_password,
                Customer.custom_location,
                Customer.custom_date_added,
                Customer.custom_street,
                Customer.custom_zip_code,
                Customer.custom_reseller,
                Customer.custom_company,
                Customer.custom_agent,
                Customer.custom_identification,
                Customer.custom_date_of_birth,
                Customer.custom_hotspot_mac,
                Customer.custom_geo_data
                )
            .run(as_dict=True)
    )
    return customers

import json
# def get_customer():
#     Customer = DocType("Customer")
    
#     customers = (
#         frappe.qb.from_(Customer)
#             .select(
#                 Customer.name,
#                 Customer.customer_name,
#                 Customer.custom_geo_data
#             )
#             .run(as_dict=True)
#     )

#     # Parse geo_data and extract coordinates
#     for geo_data in customers:
#         if geo_data.get("custom_geo_data"):
#             try:
#                 geo_json = json.loads(geo_data["custom_geo_data"])
#                 coordinates = (
#                     geo_json["features"][0]["geometry"]["coordinates"]
#                     if geo_json.get("features")
#                     else None
#                 )
#                 geo_data["coordinates"] = coordinates
#             except Exception:
#                 geo_data["coordinates"] = None
#         else:
#             geo_data["coordinates"] = None

#     return customers




# Create Payment Request for a Sales Invoice


def create_gocardless_mandate():
       
    doc = frappe.get_doc({
        "doctype": "GoCardless Mandate",
        "customer": "Suleman Saeed",
        "mandate": "Suleman Saeed",
        "gocardless_customer": "Suleman Saeed",
    })
    doc.insert(ignore_permissions=True)
    frappe.db.commit()
    frappe.local.response.http_status_code = 201
    return {
        "msg": "GoCardless Mandate Created Successfully",
        "mandate": doc.name,
        "success": True
    }




