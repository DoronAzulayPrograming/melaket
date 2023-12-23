import React from "react";
import { AuthorizeView, Authorized, NotAuthorized } from "../core/AuthProvider";
import { Navigate } from "react-router-dom";

export default function DashboardPage(){
    return (
        <AuthorizeView>
            <Authorized>
                <h1>Dashboard Page</h1>
            </Authorized>
            <NotAuthorized>
                <Navigate to="/login?rt=/auth/dashboard" />
            </NotAuthorized>
        </AuthorizeView>
    )
}