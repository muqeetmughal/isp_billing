// Copyright (c) 2025, MSS and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Subscription Enhancement", {
// 	refresh(frm) {

// 	},
// });



frappe.ui.form.on("Subscription Enhancement", {
    after_save: function(frm) {
        if (frm.doc.docstatus === 1) {  // only after Submit
            frappe.call({
                method: "isp_billing.api.subscription.send_payment_link_email", 
                args: {
                    enhancement_id: frm.doc.name
                },
                callback: function(r) {
                    if (!r.exc) {
                        frappe.msgprint(r.message || "Subscription email sent successfully!");
                    }
                }
            });
        }
    }
});


