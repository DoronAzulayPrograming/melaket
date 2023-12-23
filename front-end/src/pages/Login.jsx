import React from "react";
import { Navigate , useSearchParams} from "react-router-dom";
import { Form, Col, Container, Row, Card, Button } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Loader from "../components/Loader"

import { UsersApi } from "../core/Api/MelaketApi"
import { AuthContext } from "../core/AuthProvider";

export default function LoginPage() {
    const [loading, setLoading] = React.useState(false);
    const [searchParams] = useSearchParams();
    const {login, isLoggedIn, roles, authRoles} = React.useContext(AuthContext);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const returnUrl = searchParams.get("rt") || "/";  // Gets the rt parameter, defaults to "/" if not present

    if (isLoggedIn && (authRoles.length === 0 || authRoles.some(r => roles.includes(r)))) {
        return <Navigate to={returnUrl} />;
    }

    async function onSubmit(data) {
        setLoading(true);

        try {
            const response = await UsersApi.loginAsync(data);
            if(!response.ok){
                throw new Error(await response.text());
            }

            const user = await response.json();
            login(user);

        } catch (error) {
            console.error(error);
            toast.error(error.message);
        }
        setLoading(false);
    }
    

    return (
        <Container>
            <Row className="justify-content-center">
                <Col md={6} className="p-md-4">
                    <Card className="p-md-4">
                        <Card.Body>
                            {loading && <Loader />}
                            {!loading && 
                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <Form.Group className="mb-2" controlId="email">
                                    <Form.Label>מייל</Form.Label>
                                    <Form.Control style={{ direction: "rtl" }} type="email" {...register("email", { required: "שדה חובה" })} />
                                    {errors.email && <p className="text-danger">{errors.email.message}</p>}
                                </Form.Group>
                                <Form.Group className="mb-2" controlId="password">
                                    <Form.Label>סיסמא</Form.Label>
                                    <Form.Control style={{ direction: "rtl" }} type="password" {...register("password", { required: "שדה חובה" })} />
                                    {errors.password && <p className="text-danger">{errors.password.message}</p>}
                                </Form.Group>
                                <div className="text-center pt-3">
                                    <Button variant="primary" className="w-100" type="submit">התחברות</Button>
                                </div>
                            </Form>}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    )
}