import React from "react";
import { Spinner } from "react-bootstrap";

export default function Loader() {

    return (
        <div className="d-flex justify-content-center align-items-center">
            <Spinner animation="grow" variant="info" className="me-4 shadow" />
            <Spinner animation="grow" variant="warning" className="me-4 shadow" />
            <Spinner animation="grow" variant="info" className=" shadow" />
        </div>
    )

}