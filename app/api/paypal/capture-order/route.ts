import { auth } from "@/lib/auth"; 
import { NextResponse } from "next/server"; 
import { updateUserPaidStatus, updateOrderStatus } from "@/lib/d1"; 
 
const PAYPAL_BASE = "https://api-m.sandbox.paypal.com"; 
