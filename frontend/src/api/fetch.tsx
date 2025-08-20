import React, { useState } from "react";
import axios from "axios";
import type { SupportTicketData } from "../Data/globle";
import { useFrappeAuth } from "frappe-react-sdk";

const { currentUser } = useFrappeAuth();


const [issueTypes, setIssueTypes] = useState<{ name: string }[]>([]);
const [priorities, setPriorities] = useState<{ name: string }[]>([]);

export const fetchIssues = async () => {
  if (!currentUser) return;
  try {
    setLoading(true);
    const response = await axios.get(
      "/api/method/isp_billing.api.issue.get_issues",
      {
        params: { email: currentUser },
      }
    );
    setIssues(response.data.message || []);
  } catch (error) {
    console.error("Error fetching issues:", error);
  } finally {
    setLoading(false);
  }
};
export const fetchDropdowns = async () => {
  try {
    const [typeRes, priorityRes] = await Promise.all([
      axios.get("/api/method/isp_billing.api.issue.get_issue_type"),
      axios.get("/api/method/isp_billing.api.issue.get_issue_priority"),
    ]);
    setIssueTypes(typeRes.data.message || []);
    setPriorities(priorityRes.data.message || []);
  } catch (error) {
    console.error("Error fetching dropdowns:", error);
  }
};
