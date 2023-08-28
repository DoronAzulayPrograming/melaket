import React,{ useContext } from "react";

import { AuthContext, AuthorizeView, Authorized, NotAuthorized } from '../AuthProvider';
import { NavLink } from "react-router-dom";

export default function Dashboard(){
    const { isLoggedIn, setIsLoggedIn, roles, setRoles } = useContext(AuthContext);


    return(
        <>
            <Authorized roles={["admin"]}>
                <AdminView />
            </Authorized>
            <Authorized roles={["subAdmin"]}>
                <SubAdminView />
            </Authorized>
            <Authorized roles={["member"]}>
                <MemberView />
            </Authorized>
        </>
    )
}

function AdminView(){

    return (
        <h1>Admin View</h1>
    )
}

function SubAdminView(){


    return (
        <h1>SubAdmin View</h1>
    )
}

function MemberView(){
    return (
        <h1>Member View</h1>
    )
}