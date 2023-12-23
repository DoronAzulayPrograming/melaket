import React, { useState, useEffect, useContext } from "react"
import { toast } from "react-toastify"
import { useForm, useFieldArray } from 'react-hook-form';
import { useTable, usePagination, useSortBy, useFilters } from 'react-table';
import { ButtonGroup, Button, Modal, Form, Row, Col, Card, Container } from "react-bootstrap";

import {
    ModelsApi,
    BusinessApi,
    CodeBinaBusinessProfilesApi,
} from "../core/Api/MelaketApi"

import Steps, { Step } from "../components/Steps";
import AutocompleteInput from "../components/AutocompleteInput";
import Loader from "../components/Loader";

export default function BusinessesPage() {
    const [loading, setLoading] = useState(false)

    const stepsRef = React.useRef(null)

    const [errorMsg, setErrorMsg] = React.useState("")
    const [newBusiness, setNewBusiness] = useState(null)

    const [businesses, setBusinesses] = useState([])
    const [selectedBusiness, setSelectedBusiness] = useState(null)

    const [binaWarehouses, setBinaWarehouses] = useState([])

    const [addModalShow, setAddModalShow] = useState(false)
    const [editModalShow, setEditModalShow] = useState(false)
    const [deleteModalShow, setDeleteModalShow] = useState(false)

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            try {
                const data = await BusinessApi.getAsync();
                setBusinesses(data);
            } catch (error) {
                toast.error(error.message)
            }
            setLoading(false)
        }
        loadData()
    }, [])

    async function handleAdd(data) {
        try {

            //console.log(data)

            const res = await BusinessApi.postAsync(data);
            setBusinesses([...businesses, res])

            setAddModalShow(false)
            toast.success("עסק נוצר בהצלחה")
        } catch (error) {
            toast.error(`שגיאה ביצירת עסק: ${error.message}`)
            return
        }
    }

    async function handleUpdate(data) {
        data.id = selectedBusiness.id

        try {
            const res = await BusinessApi.putAsync(data);

            // Update the local user list after successful API update
            const updatedBusiness = [...businesses]; // Make a copy of the current users
            const index = updatedBusiness.findIndex(i => i.id === data.id); // Find the index of the updated user
            if (index !== -1) {
                updatedBusiness[index] = { ...updatedBusiness[index], ...data }; // Replace the old user data with the updated data
                setBusinesses(updatedBusiness); // Update the state
            }

            setEditModalShow(false);
            setSelectedBusiness(null)
            toast.success("עסק עודכן בהצלחה");

        } catch (error) {
            toast.error(`שגיאה בעדכון עסק: ${error.message}`)
            return
        }
    }

    const handleDelete = async () => {

        try {
            await BusinessApi.deleteAsync(selectedBusiness.id);

            setBusinesses(prev => prev.filter(b => b.id !== selectedBusiness.id))
            setDeleteModalShow(false)
            setSelectedBusiness(null)
            toast.success("עסק נמחק בהצלחה")
        } catch (error) {
            toast.error(`שגיאה במחיקת עסק: ${error.message}`)
        }
    }

    async function handleCodeBinaUpdate(data) {
        data.businessId = selectedBusiness.id
        try {
            await CodeBinaBusinessProfilesApi.putAsync(data);

            // Update the local user list after successful API update
            const updatedBusiness = [...businesses]; // Make a copy of the current users
            const index = updatedBusiness.findIndex(i => i.id === data.businessId); // Find the index of the updated user
            if (index !== -1) {
                updatedBusiness[index].codeBina = { ...updatedBusiness[index].codeBina, ...data }; // Replace the old user data with the updated data
                setBusinesses(updatedBusiness); // Update the state
            }

            setEditModalShow(false);
            setSelectedBusiness(null)
            toast.success("נתוני קוד בינה לעסק עודכנו בהצלחה");
        } catch (error) {
            toast.error(`נתוני קוד בינה לעסק: ${error.message}`)
            return
        }
    }

    async function handleKonimboUpdate(data) {
        try {
            const res = await ModelsApi.putAsync(data)

            setBusinesses(prev => {
                let clone = [...prev]
                let b = clone.find(b => b.id === selectedBusiness.id)
                let models = [...b.models]

                const index = models.findIndex(m => m.name === data.name)
                if (index < 0) return prev

                models[index] = res
                b.models = models

                return clone
            })
            toast.success("מודל קונימבו עודכן בהצלחה.")

        } catch (error) {
            toast.error(error.message)
        }
    }


    async function handleModelsSubmit(data) {
        let msg = ""
        if (!data || data.length < 1) {
            msg += "חובה לבחור לפחות מודל אחד.!"
        }
        if (!newBusiness) {
            msg += "חובה למלא עסק.!"
        }

        if (msg) {
            setErrorMsg(msg)
            return
        }

        await handleAdd({ ...newBusiness, models: data, warehouses: binaWarehouses })
    }

    function handleBusinessSubmit(data) {
        setErrorMsg("")
        setNewBusiness(data)
        stepsRef.current.Next()
    }


    const handleOpenEditModal = (business) => {
        setSelectedBusiness(business)
        setEditModalShow(true)
    }
    const handleCloseEditModal = () => {
        setSelectedBusiness(null)
        setEditModalShow(false)
    }

    const handleOpenDeleteModal = (business) => {
        setSelectedBusiness(business)
        setDeleteModalShow(true)
    }
    const handleCloseDeleteModal = () => {
        setSelectedBusiness(null)
        setDeleteModalShow(false)
    }

    return (
        <>
        {loading && <Loader/>}
        {!loading && <>
            <Container className="p-3">
                <Row className="justify-content-center">
                    <Col sm md="10" className="p-0">
                        <BusinessesTable businesses={businesses} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} >
                            <Button onClick={() => setAddModalShow(true)} size="sm">הוספת עסק</Button>
                        </BusinessesTable>
                    </Col>
                </Row>
            </Container>

            <Modal
                show={addModalShow}
                onHide={() => setAddModalShow(false)}

                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        הוספת עסק
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Steps ref={stepsRef} hideBtns={true}>
                        <Step>
                            <BusinessForm business={newBusiness} onSubmit={handleBusinessSubmit} />
                        </Step>
                        <Step>
                            <BinaWarehouses model={binaWarehouses} onSubmit={(data) => { setBinaWarehouses(data); stepsRef.current.Next() }} />
                        </Step>
                        <Step>
                            {errorMsg && <p className="text-danger">{errorMsg}</p>}
                            <Models binaWarehouses={binaWarehouses} onSubmit={handleModelsSubmit} />
                        </Step>
                    </Steps>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setAddModalShow(false)}>סגירה</Button>
                </Modal.Footer>
            </Modal>

            {selectedBusiness &&
                <Modal
                    show={editModalShow}
                    onHide={handleCloseEditModal}

                    size="lg"
                    aria-labelledby="contained-modal-title-vcenter"
                    centered
                >
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            עריכת עסק
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <BusinessEditForm
                            business={selectedBusiness}
                            onBusinessUpdate={handleUpdate}
                            onCodeBinaUpdate={handleCodeBinaUpdate}
                            onKonimboUpdate={handleKonimboUpdate}
                        />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseEditModal}>סגירה</Button>
                    </Modal.Footer>
                </Modal>}

            {selectedBusiness &&
                <Modal
                    show={deleteModalShow}
                    onHide={handleCloseDeleteModal}

                    size="lg"
                    aria-labelledby="contained-modal-title-vcenter"
                    centered
                >
                    <Modal.Header closeButton closeVariant="white" className="bg-danger text-white">
                        <Modal.Title id="contained-modal-title-vcenter">
                            אזהרה
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        בטוח שברצונך למחוק עסק זה ? {selectedBusiness.name}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" onClick={handleDelete}>אישור</Button>
                        <Button variant="secondary" onClick={handleCloseDeleteModal}>סגירה</Button>
                    </Modal.Footer>
                </Modal>}
            </>}
        </>
    )
}

function Models(props) {
    const [konimbo, setKonimbo] = useState(null)
    const [konimboSet, setKonimboSet] = useState(false)
    const [konimboCheck, setKonimboCheck] = useState(false)
    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

    useEffect(() => {
        register("models", { required: "חייב לבחור מודל" })
        setValue("models", [])
    }, [])

    function clearKonimbo() {
        let models = [...getValues("models")]
        models = models.filter(m => m.name !== "קונימבו")
        setValue("models", models)
        setKonimboSet(false)
        setKonimboCheck(!konimboCheck);
    }

    function handleKonimboSubmit(data) {
        setKonimbo(data)
        setKonimboSet(true)
        setValue("models", [...getValues("models"), data])
    }

    const onSubmit = (data) => {
        props.onSubmit(data.models)
    }

    return (
        <>
            <h1>מודלים</h1>

            {errors.models && <p className="text-danger">{errors.models.message}</p>}

            <div>
                <Form.Check
                    className="no-select"
                    id="konimbo"
                    type="checkbox"
                    label="קונימבו"
                    value="konimbo"
                    checked={konimboCheck}
                    onChange={() => clearKonimbo()}
                />
                {konimboCheck && !konimboSet &&
                    <Card>
                        <Card.Body>
                            <KonimboForm binaWarehouses={props.binaWarehouses} model={konimbo} onSubmit={handleKonimboSubmit} />
                        </Card.Body>
                    </Card>
                }
            </div>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <div className="d-flex justify-content-center pt-2">
                    <Button type="submit">אישור</Button>
                </div>
            </Form>
        </>
    )
}

function KonimboForm(props) {
    const [konimboDataSet, setKonimboDataSet] = React.useState(null)
    const [konimboDataCheck, setKonimboDataCheck] = React.useState(null)

    const [shop, setShop] = React.useState(null)
    const [codeBina, setCodeBina] = React.useState(null)
    const [sendGrid, setSendGrid] = React.useState(null)
    const [kbWarehouses, setKbWarehouses] = React.useState([])

    const stepsRef = React.useRef(null)
    const [model, setModel] = React.useState(props.model ?? {
        name: "", price: 0,
        data: {
            codeBinaPaypalCashier: 0,
            codeBinaCreditCashier: 0,
            codeBinaDiscountItemNumber: "",
            codeBinaPointItemNumber: "",
            codeBinaB2CItemNumber: "",
            codeBinaB2CHarigItemNumber: "",
            codeBinaPickupItemNumber: "",
            codeBinaCustomerNo: 0,
            shopName: "",
            shopUrl: "",
            subDomain: "",
            shippingCompany: "",
            orderToken: "",
            itemsToken: "",
            debitToken: "",
            finalOrderStatus: "",
            failedOrderStatus: "",
            sendGridToken: "",
            sendGridEmail: "",
            sendGridTemplatePickup: "",
            sendGridTemplatePoint: "",
            sendGridTemplateB2C: "",
        }
    })
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();


    React.useEffect(() => {
        register("name", { required: "שם מודל הינו חובה" })
        setValue("name", "קונימבו")
        //register("jsonData", { required: "שם מודל הינו חובה" })
        //setValue("jsonData", "{}")
        if (props.model) {
            setCodeBina({
                codeBinaPaypalCashier: props.model.data.codeBinaPaypalCashier,
                codeBinaCreditCashier: props.model.data.codeBinaCreditCashier,
                codeBinaDiscountItemNumber: props.model.data.codeBinaDiscountItemNumber,
                codeBinaPointItemNumber: props.model.data.codeBinaPointItemNumber,
                codeBinaB2CItemNumber: props.model.data.codeBinaB2CItemNumber,
                codeBinaB2CHarigItemNumber: props.model.data.codeBinaB2CHarigItemNumber,
                codeBinaPickupItemNumber: props.model.data.codeBinaPickupItemNumber,
                codeBinaCustomerNo: props.model.data.codeBinaCustomerNo
            })
            setShop({
                shopName: props.model.data.shopName,
                shopUrl: props.model.data.shopUrl,
                subDomain: props.model.data.subDomain,
                shippingCompany: props.model.data.shippingCompany,
                shippingToken: props.model.data.shippingToken,
                orderToken: props.model.data.orderToken,
                itemsToken: props.model.data.itemsToken,
                debitToken: props.model.data.debitToken,
                cancelOrderReasons: props.model.data.cancelOrderReasons,
                finalOrderStatus: props.model.data.finalOrderStatus,
                failedOrderStatus: props.model.data.failedOrderStatus
            })
            setSendGrid({
                sendGridToken: props.model.data.sendGridToken,
                sendGridEmail: props.model.data.sendGridEmail,
                sendGridTemplatePickup: props.model.data.sendGridTemplatePickup,
                sendGridTemplatePoint: props.model.data.sendGridTemplatePoint,
                sendGridTemplateB2C: props.model.data.sendGridTemplateB2C,
                sendGridSignature: props.model.data.sendGridSignature
            })

            setKbWarehouses(props.model.data.warehouses)
        }
        console.log(props.binaWarehouses)
    }, [])

    const onSubmit = (data) => {
        let a;
        if (props.model?.data)
            a = { ...props.model.data, ...data.codeBinaData, ...data.shopData, ...data.sendGridData }
        else a = { ...data.codeBinaData, ...data.shopData, ...data.sendGridData }

        if (data.warehousesData)
            a.warehouses = data.warehousesData

        let res = { price: data.price, name: data.name, jsonData: JSON.stringify(a) }

        if (props.model?.id > -1)
            res = { id: props.model.id, ...res }

        props.onSubmit(res)
        //console.log(res)
    }

    function clearKonimboData() {
        setKonimboDataSet(false)
        setKonimboDataCheck(!konimboDataCheck)
    }

    function handleCodeBinaSubmit(data) {
        setValue("codeBinaData", data, { shouldValidate: true })
        setCodeBina(data)
        stepsRef.current.Next()
    }

    function handleShopDataSubmit(data) {
        setValue("shopData", data, { shouldValidate: true })
        setShop(data)
        stepsRef.current.Next()
    }

    function handleSendGridDataSubmit(data) {
        setValue("sendGridData", data, { shouldValidate: true })
        setSendGrid(data)
        stepsRef.current.Next()
    }

    function handleWarehousesDataSubmit(data) {
        setValue("warehousesData", data, { shouldValidate: true })
        setKbWarehouses(data)
        stepsRef.current.Next()
    }

    return (
        <>
            <Form onSubmit={handleSubmit(onSubmit)}>
                <Form.Group controlId="price">
                    <Form.Label>מחיר</Form.Label>
                    <Form.Control
                        style={{ direction: "rtl" }}
                        type="number"
                        defaultValue={model.price}
                        {...register("price", {
                            valueAsNumber: true,
                            required: "שדה זה הינו חובה",
                            min: {
                                value: 1,
                                message: "הערך המינימלי הוא 1"
                            }
                        }
                        )}
                    />
                    {errors.price && <p className="text-danger">{errors.price.message}</p>}
                </Form.Group>
                <Form.Check
                    className="no-select"
                    id="konimboData"
                    type="checkbox"
                    label="נתוני לקוח"
                    value="konimboData"
                    onChange={() => clearKonimboData()}
                />
                {!konimboDataCheck && <Button type="submit" >אישור</Button>}
            </Form>
            <div>
                {konimboDataCheck && !konimboDataSet && <>

                    {errors.codeBinaData && <p className="text-danger">{errors.codeBinaData.message}</p>}
                    {errors.shopData && <p className="text-danger">{errors.shopData.message}</p>}
                    {errors.sendGridData && <p className="text-danger">{errors.sendGridData.message}</p>}
                    {errors.warehousesData && <p className="text-danger">{errors.warehousesData.message}</p>}

                    <input type="hidden" {...register("codeBinaData", { required: "נתוני קוד בינה הינם חובה" })} />
                    <input type="hidden" {...register("shopData", { required: "נתוני חנות הינם חובה" })} />
                    <input type="hidden" {...register("sendGridData", { required: "נתוני sendGrid הינם חובה" })} />
                    <input type="hidden" {...register("warehousesData", { required: "נתוני מחסנים הינם חובה" })} />

                    <Steps ref={stepsRef} hideBtns={false}>
                        <Step>
                            <KonimboFormCodeBinaForm model={codeBina} onSubmit={handleCodeBinaSubmit} />
                        </Step>
                        <Step>
                            <ShopForm model={shop} onSubmit={handleShopDataSubmit} />
                        </Step>
                        <Step>
                            <SendGridForm model={sendGrid} onSubmit={handleSendGridDataSubmit} />
                        </Step>
                        <Step>
                            <KonimboWarehouses binaWarehouses={props.binaWarehouses} model={kbWarehouses} onSubmit={handleWarehousesDataSubmit} />
                        </Step>
                        <Step>
                            <Form onSubmit={handleSubmit(onSubmit)}>
                                <h1>לחץ אישור לסיום</h1>
                                <Button type="submit" >אישור</Button>
                            </Form>
                        </Step>
                    </Steps>
                </>
                }
            </div>
        </>
    )
}

function KonimboFormCodeBinaForm(props) {
    const [model, setModel] = React.useState(props.model ?? {
        codeBinaPaypalCashier: 0,
        codeBinaCreditCashier: 0,
        codeBinaDiscountItemNumber: "",
        codeBinaPointItemNumber: "",
        codeBinaB2CItemNumber: "",
        codeBinaB2CHarigItemNumber: "",
        codeBinaPickupItemNumber: "",
        codeBinaCustomerNo: 0
    })

    React.useEffect(() => {
        setModel(props.model ?? {
            codeBinaPaypalCashier: 0,
            codeBinaCreditCashier: 0,
            codeBinaDiscountItemNumber: "",
            codeBinaPointItemNumber: "",
            codeBinaB2CItemNumber: "",
            codeBinaB2CHarigItemNumber: "",
            codeBinaPickupItemNumber: "",
            codeBinaCustomerNo: 0
        })
    }, [props.model])

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = (data) => {
        if (!props.onSubmit) return
        props.onSubmit(data)
    }

    return (
        <Card className="mb-3">
            <Card.Header>
                <h5>קוד בינה</h5>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row>
                        <Col md="6 mb-3">
                            <Form.Group controlId="codeBinaPaypalCashier">
                                <Form.Label>קופת פייפל קוד בינה</Form.Label>
                                <Form.Control
                                    style={{ direction: "rtl" }}
                                    type="number"
                                    defaultValue={!Number.isInteger(model.codeBinaPaypalCashier) || model.codeBinaPaypalCashier === 0 ? "" : model.codeBinaPaypalCashier}
                                    {...register("codeBinaPaypalCashier", {
                                        valueAsNumber: true,
                                        min: {
                                            value: 1,
                                            message: "הערך המינימלי הוא 1"
                                        }
                                    }
                                    )}
                                />
                                {errors.codeBinaPaypalCashier && <p className="text-danger">{errors.codeBinaPaypalCashier.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="codeBinaCreditCashier">
                                <Form.Label>קופת אשראי קוד בינה</Form.Label>
                                <Form.Control
                                    style={{ direction: "rtl" }}
                                    type="number"
                                    defaultValue={model.codeBinaCreditCashier}
                                    {...register("codeBinaCreditCashier", {
                                        valueAsNumber: true,
                                        required: "שדה זה הינו חובה",
                                        min: {
                                            value: 1,
                                            message: "הערך המינימלי הוא 1"
                                        }
                                    }
                                    )}
                                />
                                {errors.codeBinaCreditCashier && <p className="text-danger">{errors.codeBinaCreditCashier.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="codeBinaDiscountItemNumber">
                                <Form.Label>מקט הנחת שורה קוד בינה</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.codeBinaDiscountItemNumber}
                                    {...register("codeBinaDiscountItemNumber", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.codeBinaDiscountItemNumber && <p className="text-danger">{errors.codeBinaDiscountItemNumber.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="codeBinaPointItemNumber">
                                <Form.Label>מקט נקודות איסוף קוד בינה</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.codeBinaPointItemNumber}
                                    {...register("codeBinaPointItemNumber", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.codeBinaPointItemNumber && <p className="text-danger">{errors.codeBinaPointItemNumber.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="codeBinaB2CItemNumber">
                                <Form.Label>מקט משלוח עם שליח בקוד בינה</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.codeBinaB2CItemNumber}
                                    {...register("codeBinaB2CItemNumber", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.codeBinaB2CItemNumber && <p className="text-danger">{errors.codeBinaB2CItemNumber.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="codeBinaB2CHarigItemNumber">
                                <Form.Label>מקט חבילה חריגה בקוד בינה</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.codeBinaB2CHarigItemNumber}
                                    {...register("codeBinaB2CHarigItemNumber", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.codeBinaB2CHarigItemNumber && <p className="text-danger">{errors.codeBinaB2CHarigItemNumber.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="codeBinaPickupItemNumber">
                                <Form.Label>מקט איסוף עצמי בקוד בינה</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.codeBinaPickupItemNumber}
                                    {...register("codeBinaPickupItemNumber", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.codeBinaPickupItemNumber && <p className="text-danger">{errors.codeBinaPickupItemNumber.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="codeBinaCustomerNo">
                                <Form.Label>כרטסת חשבוניות קוד בינה</Form.Label>
                                <Form.Control
                                    style={{ direction: "rtl" }}
                                    type="number"
                                    defaultValue={model.codeBinaCustomerNo}
                                    {...register("codeBinaCustomerNo", {
                                        required: "שדה זה הינו חובה",
                                        min: {
                                            value: 1,
                                            message: "ערך מינימלי 1"
                                        }
                                    }
                                    )}
                                />
                                {errors.codeBinaCustomerNo && <p className="text-danger">{errors.codeBinaCustomerNo.message}</p>}
                            </Form.Group>
                        </Col>
                    </Row>
                    <div>
                        <Button type="submit">אישור</Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    )
}

function ShopForm(props) {
    const [model, setModel] = React.useState(props.model ?? {
        shopName: "",
        shopUrl: "",
        subDomain: "",
        shippingCompany: "",
        shippingToken: "",
        orderToken: "",
        itemsToken: "",
        debitToken: "",
        finalOrderStatus: "",
        failedOrderStatus: ""
    })

    React.useEffect(() => {
        setModel(props.model ?? {
            shopName: "",
            shopUrl: "",
            subDomain: "",
            shippingCompany: "",
            shippingToken: "",
            orderToken: "",
            itemsToken: "",
            debitToken: "",
            cancelOrderReasons: "",
            finalOrderStatus: "",
            failedOrderStatus: ""
        })
    }, [props.model])

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = (data) => {
        if (!props.onSubmit) return
        props.onSubmit(data)
    }

    return (
        <Card className="mb-3">
            <Card.Header>
                <h5>חנות</h5>
            </Card.Header>
            <Card.Body>
                <Form onSubmit={handleSubmit(onSubmit)}>
                    <Row>
                        <Col md="6 mb-3">
                            <Form.Group controlId="shopName">
                                <Form.Label>שם החנות</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.shopName}
                                    {...register("shopName", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.shopName && <p className="text-danger">{errors.shopName.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="shopUrl">
                                <Form.Label>קישור החנות</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.shopUrl}
                                    {...register("shopUrl", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.shopUrl && <p className="text-danger">{errors.shopUrl.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="subDomain">
                                <Form.Label>תת דומיין בקונימבו</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.subDomain}
                                    {...register("subDomain", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.subDomain && <p className="text-danger">{errors.subDomain.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="shippingCompany">
                                <Form.Label>חברת משלוחים</Form.Label>
                                <Form.Control
                                    as="select"
                                    defaultValue={model.shippingCompany}
                                    {...register("shippingCompany", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                >
                                    <option value="">בחר</option>
                                    <option value="cheetah">צ'יטה</option>
                                </Form.Control>
                                {errors.shippingCompany && <p className="text-danger">{errors.shippingCompany.message}</p>}
                            </Form.Group>
                        </Col>

                        <Col md="6 mb-3">
                            <Form.Group controlId="shippingToken">
                                <Form.Label>טוקן משלוחים</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.shippingToken}
                                    {...register("shippingToken", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.shippingToken && <p className="text-danger">{errors.shippingToken.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="orderToken">
                                <Form.Label>טוקן api הזמנות קונימבו</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.orderToken}
                                    {...register("orderToken", {
                                        required: "שדה זה הינו חובה",
                                        minLength: {
                                            value: 64,
                                            message: "ערך מינימלי 64  תווים"
                                        },
                                        maxLength: {
                                            value: 128,
                                            message: "ערך מקסימלי 128 תווים"
                                        }
                                    }
                                    )}
                                />
                                {errors.orderToken && <p className="text-danger">{errors.orderToken.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="itemsToken">
                                <Form.Label>טוקן api פריטים קונימבו</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.itemsToken}
                                    {...register("itemsToken", {
                                        required: "שדה זה הינו חובה",
                                        minLength: {
                                            value: 64,
                                            message: "ערך מינימלי 64  תווים"
                                        },
                                        maxLength: {
                                            value: 128,
                                            message: "ערך מקסימלי 128 תווים"
                                        }
                                    }
                                    )}
                                />
                                {errors.itemsToken && <p className="text-danger">{errors.itemsToken.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="debitToken">
                                <Form.Label>טוקן api אשראי קונימבו</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.debitToken}
                                    {...register("debitToken", {
                                        required: "שדה זה הינו חובה",
                                        minLength: {
                                            value: 64,
                                            message: "ערך מינימלי 64  תווים"
                                        },
                                        maxLength: {
                                            value: 128,
                                            message: "ערך מקסימלי 128 תווים"
                                        }
                                    }
                                    )}
                                />
                                {errors.debitToken && <p className="text-danger">{errors.debitToken.message}</p>}
                            </Form.Group>
                        </Col>


                        <Col md="6 mb-3">
                            <Form.Group controlId="finalOrderStatus">
                                <Form.Label>מצב הזמנה שלוקטה בהצלחה</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.finalOrderStatus}
                                    {...register("finalOrderStatus", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.finalOrderStatus && <p className="text-danger">{errors.finalOrderStatus.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="failedOrderStatus">
                                <Form.Label>מצב הזמנה בתקלה</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.failedOrderStatus}
                                    {...register("failedOrderStatus", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.failedOrderStatus && <p className="text-danger">{errors.failedOrderStatus.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="12 mb-3">
                            <Form.Group controlId="cancelOrderReasons">
                                <Form.Label>סיבות ביטול הזמנה</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    defaultValue={model.cancelOrderReasons}
                                    {...register("cancelOrderReasons")}
                                />
                                {errors.cancelOrderReasons && <p className="text-danger">{errors.cancelOrderReasons.message}</p>}
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="pt-2">
                        <Button type="submit">אישור</Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    )
}

function SendGridForm(props) {
    const [model, setModel] = React.useState(props.model ?? {
        sendGridToken: "",
        sendGridEmail: "",
        sendGridTemplatePickup: "",
        sendGridTemplatePoint: "",
        sendGridTemplateB2C: "",
        sendGridSignature: ""
    })

    React.useEffect(() => {
        setModel(props.model ?? {
            sendGridToken: "",
            sendGridEmail: "",
            sendGridTemplatePickup: "",
            sendGridTemplatePoint: "",
            sendGridTemplateB2C: "",
            sendGridSignature: ""
        })
    }, [props.model])

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = (data) => {
        if (!props.onSubmit) return
        props.onSubmit(data)
    }

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Card className="mb-3">
                <Card.Header>
                    <h5>SendGrid</h5>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md="6 mb-3">
                            <Form.Group controlId="sendGridToken">
                                <Form.Label>טוקן SendGrid</Form.Label>
                                <Form.Control
                                    type="text"
                                    defaultValue={model.sendGridToken}
                                    {...register("sendGridToken", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.sendGridToken && <p className="text-danger">{errors.sendGridToken.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="sendGridEmail">
                                <Form.Label>אימייל SendGrid</Form.Label>
                                <Form.Control
                                    type="email"
                                    defaultValue={model.sendGridEmail}
                                    {...register("sendGridEmail", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.sendGridEmail && <p className="text-danger">{errors.sendGridEmail.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="sendGridTemplatePickup">
                                <Form.Label>תבנית למייל איסוף עצמי SendGrid</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    defaultValue={model.sendGridTemplatePickup}
                                    {...register("sendGridTemplatePickup", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.sendGridTemplatePickup && <p className="text-danger">{errors.sendGridTemplatePickup.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="sendGridTemplatePoint">
                                <Form.Label>תבנית למייל נקודת איסוף SendGrid</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    defaultValue={model.sendGridTemplatePoint}
                                    {...register("sendGridTemplatePoint", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.sendGridTemplatePoint && <p className="text-danger">{errors.sendGridTemplatePoint.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="6 mb-3">
                            <Form.Group controlId="sendGridTemplateB2C">
                                <Form.Label>תבנית למייל משלוח עם שליח SendGrid</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    defaultValue={model.sendGridTemplateB2C}
                                    {...register("sendGridTemplateB2C", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.sendGridTemplateB2C && <p className="text-danger">{errors.sendGridTemplateB2C.message}</p>}
                            </Form.Group>
                        </Col>
                        <Col md="12 mb-3">
                            <Form.Group controlId="sendGridSignature">
                                <Form.Label>תבנית חתימה למייל SendGrid</Form.Label>
                                <Form.Control
                                    as="textarea"
                                    defaultValue={model.sendGridSignature}
                                    {...register("sendGridSignature", {
                                        required: "שדה זה הינו חובה"
                                    }
                                    )}
                                />
                                {errors.sendGridSignature && <p className="text-danger">{errors.sendGridSignature.message}</p>}
                            </Form.Group>
                        </Col>
                    </Row>
                    <div className="pt-2">
                        <Button type="submit">אישור</Button>
                    </div>
                </Card.Body>
            </Card>
        </Form>
    )
}

function KonimboWarehouses(props) {

    const { register, setValue, control, handleSubmit, formState: { errors } } = useForm();

    const { fields, append, remove } = useFieldArray({
        control,
        name: "warehouses"
    });

    const [warehouse, setWarehouse] = React.useState({
        warehouseId: 0,
        pickupKonimboId: 0,
        address: 0,
        orderStatus: '',
        pickupStatus: '',
        shippingAuth: '',
        orderPriority: 0,
        orderEnable: false
    });

    const handleInputChange = (index, field, value) => {
        setValue(`warehouses[${index}].${field}`, value, { shouldValidate: true });
    };

    React.useEffect(() => {
        if (!props.model) return

        const t = [...props.model]
        t.forEach((data, index) => {
            append(data)
            //setValue(`warehouses[${index}]`, data, { shouldValidate: true })
        })

    }, [props.model])

    const onSubmit = (data) => {
        if (!props.onSubmit) return
        props.onSubmit(data.warehouses)
    }

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Card className="mb-3">
                <Card.Header>
                    <h5>מחסנים</h5>
                </Card.Header>
                <Card.Body>
                    <Col className='mb-2'>
                        <Button variant="secondary" type='button' onClick={() => append(warehouse)}>הוסף מחסן</Button>
                    </Col>
                    <Col className='mb-2'>

                        {fields.map((item, index) => (
                            <div key={item.id}>
                                <Row className=" border-top border-bottom">
                                    <Col md="10">
                                        <Row className="mb-5">
                                            <Col md="6">
                                                <Form.Group controlId={`${index}-warehouseId`}>
                                                    <Form.Label>מחסן</Form.Label>
                                                    <AutocompleteInput
                                                        value={item.warehouseId}
                                                        suggestions={props.binaWarehouses}
                                                        {...register(`warehouses[${index}].warehouseId`, { required: true })}
                                                        onSelect={(selectedItem) => {
                                                            if (selectedItem)
                                                                handleInputChange(index, 'warehouseId', selectedItem.id)
                                                            else handleInputChange(index, 'warehouseId', null)
                                                        }}
                                                    />
                                                    {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].warehouseId && <p className="text-danger">שדה זה הינו חובה</p>}
                                                </Form.Group>
                                            </Col>
                                            <Col md="6">
                                                <Form.Group controlId={`${index}-shippingAuth`}>
                                                    <Form.Label>קוד משלוח</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        {...register(`warehouses[${index}].shippingAuth`, { required: true })}
                                                        onChange={(e) =>
                                                            handleInputChange(index, 'shippingAuth', e.target.value)
                                                        } />
                                                    {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].shippingAuth && <p className="text-danger">שדה זה הינו חובה</p>}
                                                </Form.Group>
                                            </Col>
                                            <Col md="6">
                                                <Form.Group controlId={`${index}-orderStatus`}>
                                                    <Form.Label>מצב הזמנה</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        {...register(`warehouses[${index}].orderStatus`, { required: true })}
                                                        onChange={(e) =>
                                                            handleInputChange(index, 'orderStatus', e.target.value)
                                                        } />
                                                    {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].orderStatus && <p className="text-danger">שדה זה הינו חובה</p>}
                                                </Form.Group>
                                            </Col>
                                            <Col md="6">
                                                <Form.Group controlId={`${index}-pickupStatus`}>
                                                    <Form.Label>מצב איסוף</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        {...register(`warehouses[${index}].pickupStatus`, { required: true })}
                                                        onChange={(e) =>
                                                            handleInputChange(index, 'pickupStatus', e.target.value)
                                                        } />
                                                    {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].pickupStatus && <p className="text-danger">שדה זה הינו חובה</p>}
                                                </Form.Group>
                                            </Col>
                                            <Col md="6">
                                                <Form.Group controlId={`${index}-orderPriority`}>
                                                    <Form.Label>עדיפות</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register(`warehouses[${index}].orderPriority`, { required: true, valueAsNumber: true })}
                                                        onChange={(e) =>
                                                            handleInputChange(index, 'orderPriority', e.target.value)
                                                        } />
                                                    {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].orderPriority && <p className="text-danger">שדה זה הינו חובה</p>}
                                                </Form.Group>
                                            </Col>
                                            <Col md="6 d-flex align-items-end">
                                                <Form.Group controlId={`${index}-orderEnable`}>
                                                    <Form.Check
                                                        className="no-select"
                                                        id={`${index}-orderEnable`}
                                                        type="checkbox"
                                                        label="אפשר משלוחים"
                                                        onChange={() => clearKonimboData()}
                                                        {...register(`warehouses[${index}].orderEnable`)}
                                                    />
                                                    {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].orderEnable && <p className="text-danger">שדה זה הינו חובה</p>}
                                                </Form.Group>
                                            </Col>
                                            <Col md="6">
                                                <Form.Group controlId={`${index}-pickupKonimboId`}>
                                                    <Form.Label>מזהה איסוף עצמי בקונימבו</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        {...register(`warehouses[${index}].pickupKonimboId`, { required: true, valueAsNumber: true })}
                                                        onChange={(e) =>
                                                            handleInputChange(index, 'pickupKonimboId', e.target.value)
                                                        } />
                                                    {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].pickupKonimboId && <p className="text-danger">שדה זה הינו חובה</p>}
                                                </Form.Group>
                                            </Col>
                                            <Col md="12">
                                                <Form.Group controlId={`${index}-address`}>
                                                    <Form.Label>כתובת ושעות פעילות לאיסוף עצמי</Form.Label>
                                                    <Form.Control
                                                        as="textarea"
                                                        {...register(`warehouses[${index}].address`, { required: true })}
                                                        onChange={(e) =>
                                                            handleInputChange(index, 'address', e.target.value)
                                                        } />
                                                    {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].address && <p className="text-danger">שדה זה הינו חובה</p>}
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Col>
                                    <Col md="2 d-flex align-items-center">
                                        <Button onClick={() => remove(index)}>הסר</Button>
                                    </Col>
                                </Row>
                            </div>
                        ))}
                    </Col>

                    <div className="pt-2">
                        <Button type="submit">אישור</Button>
                    </div>
                </Card.Body>
            </Card>
        </Form>
    )
}

function BinaWarehouses(props) {
    const [errorMsg, setErrorMsg] = React.useState(null)
    const { register, setValue, control, handleSubmit, formState: { errors } } = useForm();

    const [warehouse, setWarehouse] = React.useState({
        id: 0,
        name: ""
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: "warehouses"
    });

    const handleInputChange = (index, field, value) => {
        setValue(`warehouses[${index}].${field}`, value, { shouldValidate: true });
    };

    React.useEffect(() => {
        if (!props.model) return
        const t = [...props.model]
        t.forEach((data, index) => {
            append(data)
        })

    }, [props.model])

    const onSubmit = (data) => {
        if (data.warehouses.length < 1) {
            setErrorMsg("חובה למלא מחסן אחד לפחות")
            return
        }
        setErrorMsg(null)

        if (!props.onSubmit) return
        props.onSubmit(data.warehouses)
    }


    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Card className="mb-3">
                <Card.Header>
                    <h5>מחסנים</h5>
                </Card.Header>
                <Card.Body>
                    {errorMsg && <p className="text-danger">{errorMsg}</p>}
                    <Col className='mb-2'>
                        <Button variant="secondary" type='button' onClick={() => { setErrorMsg(null); append(warehouse) }}>הוסף מחסן</Button>
                    </Col>
                    <Col className='mb-2'>

                        {fields.map((item, index) => (
                            <div key={item.id}>
                                <Row className="mb-5">
                                    <Col md="5">
                                        <Form.Group controlId={`${index}-name`}>
                                            <Form.Label>שם</Form.Label>
                                            <Form.Control
                                                type="text"
                                                {...register(`warehouses[${index}].name`, { required: true })}
                                                onChange={(e) =>
                                                    handleInputChange(index, 'name', e.target.value)
                                                }
                                            />
                                            {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].name && <p className="text-danger">שדה זה הינו חובה</p>}
                                        </Form.Group>
                                    </Col>
                                    <Col md="5">
                                        <Form.Group controlId={`${index}-id`}>
                                            <Form.Label>מזהה בקוד בינה</Form.Label>
                                            <Form.Control
                                                type="number"
                                                {...register(`warehouses[${index}].id`, {
                                                    required: true,
                                                    valueAsNumber: true,
                                                    min: {
                                                        value: 1,
                                                        message: "ערך מינימלי 1"
                                                    }
                                                })}
                                                onChange={(e) =>
                                                    handleInputChange(index, 'id', e.target.value)
                                                }
                                            />
                                            {errors.warehouses && errors.warehouses[index] && errors.warehouses[index].id && <p className="text-danger">שדה זה הינו חובה</p>}
                                        </Form.Group>
                                    </Col>
                                    <Col md="2">
                                        <Form.Label>&nbsp;</Form.Label>
                                        <div>
                                            <Button onClick={() => remove(index)} >הסר</Button>
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        ))}
                    </Col>

                    <div className="pt-2">
                        <Button type="submit">אישור</Button>
                    </div>
                </Card.Body>
            </Card>
        </Form>
    )

}


function BusinessEditForm(props) {
    const [konimbo, setKonimbo] = useState(null)
    const [fillKonimbo, setFillKonimbo] = useState(false)
    const [fillCodeBina, setFillCodeBina] = useState(false)

    React.useEffect(() => {
        if (props.business.models) {
            const k = props.business.models.find(w => w.name === "קונימבו")
            if (k)
                setKonimbo(k)
        }

    }, [props.business])

    return (
        <>
            <BusinessForm business={props.business} onSubmit={props.onBusinessUpdate} />

            <Card className="mt-3">
                <Card.Header>
                    <Col onClick={() => setFillCodeBina(!fillCodeBina)} style={{ cursor: "pointer" }} className="d-flex justify-content-between">
                        <h6><b>קוד בינה</b></h6>
                        <Form.Check
                            className="no-select"
                            id="codeBinaForm"
                            label="עריכה"
                            checked={fillCodeBina}
                            onChange={() => setFillCodeBina(!fillCodeBina)}
                        />
                    </Col>
                </Card.Header>
                {fillCodeBina && <Card.Body>
                    <CodeBinaForm codeBina={props.business.codeBina} onSubmit={props.onCodeBinaUpdate} />
                </Card.Body>}
            </Card>

            {konimbo &&
                <Card className="mt-3">
                    <Card.Header>
                        <Col onClick={() => setFillKonimbo(!fillKonimbo)} style={{ cursor: "pointer" }} className="d-flex justify-content-between">
                            <h6><b>קונימבו</b></h6>
                            <Form.Check
                                className="no-select"
                                id="konimboForm"
                                label="עריכה"
                                checked={fillKonimbo}
                                onChange={() => setFillKonimbo(!fillKonimbo)}
                            />
                        </Col>
                    </Card.Header>
                    {fillKonimbo && <Card.Body>
                        <KonimboForm binaWarehouses={props.business.warehouses.map(w => { w.id = w.warehouseId; w.name = w.warehouseName; return w })} model={konimbo} onSubmit={props.onKonimboUpdate} />
                    </Card.Body>}
                </Card>}
        </>
    )
}


export function BusinessForm(props) {
    const [fillCodeBina, setFillCodeBina] = useState(false)

    const defaultBusiness = { email: "", name: "", codeBina: { host: "", user: "", password: "", customerNo: 0 } };
    const [business, setBusiness] = useState(props.business ? { ...defaultBusiness, ...props.business } : defaultBusiness);

    const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm();

    const onSubmit = data => {
        if (!props.onSubmit) return
        if (!data.id && data.id !== 0)
            data.id = 0
        props.onSubmit(data);
        reset({})
        setFillCodeBina(false)
    };

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
                <Col md="6 mb-2">
                    {/* Name Input */}
                    <Form.Group controlId="name">
                        <Form.Label>שם</Form.Label>
                        <Form.Control
                            type="name"
                            defaultValue={business.name}
                            {...register("name", {
                                required: "שדה זה הינו חובה.",
                                maxLength: {
                                    value: 128,
                                    message: "ערך מקסימלי של 128 תווים"
                                }
                            }
                            )}
                        />
                        {errors.name && <p className="text-danger">{errors.name.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6 mb-2">
                    {/* Email Input */}
                    <Form.Group controlId="email">
                        <Form.Label>אימייל</Form.Label>
                        <Form.Control style={{ direction: "rtl" }}
                            type="text"
                            defaultValue={business.email}
                            {...register("email", {
                                required: "שדה זה הינו חובה.",
                                pattern: {
                                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                                    message: "כתובת אימייל לא תקינה"
                                },
                                maxLength: {
                                    value: 191,
                                    message: "ערך מקסימלי של 191 תווים"
                                }
                            })}
                        />
                        {errors.email && <p className="text-danger">{errors.email.message}</p>}
                    </Form.Group>
                </Col>
                {!props.business?.id && <>
                    <Col md="12">
                        <Form.Check
                            className="no-select"
                            id="codeBinaForm"
                            label="מלא נתוני לקוח"
                            checked={fillCodeBina}
                            onChange={() => setFillCodeBina(!fillCodeBina)}
                        />
                    </Col>

                    <Col md="6 mb-2">
                        {/* Name Input */}
                        <Form.Group controlId="codeBinaHost">
                            <Form.Label>מארח קוד בינה</Form.Label>
                            <Form.Control
                                type="text"
                                disabled={!fillCodeBina}
                                defaultValue={business.codeBina.host}
                                {...(fillCodeBina ?
                                    register("codeBina.host", {
                                        required: "שדה זה הינו חובה.",
                                        pattern: {
                                            value: /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i,
                                            message: "כתובת לא חוקית"
                                        }
                                    }) : {}
                                )}
                            />
                            {errors.codeBina?.host && <p className="text-danger">{errors.codeBina.host.message}</p>}
                        </Form.Group>
                    </Col>
                    <Col md="6 mb-2">
                        {/* Name Input */}
                        <Form.Group controlId="codeBinaUser">
                            <Form.Label>משתמש קוד בינה</Form.Label>
                            <Form.Control
                                type="text"
                                disabled={!fillCodeBina}
                                defaultValue={business.codeBina.user}
                                {...(fillCodeBina ?
                                    register("codeBina.user", {
                                        required: "שדה זה הינו חובה.",
                                        maxLength: {
                                            value: 64,
                                            message: "ערך מקסימלי של 64 תווים"
                                        }
                                    }) : {}
                                )}
                            />
                            {errors.codeBina?.user && <p className="text-danger">{errors.codeBina.user.message}</p>}
                        </Form.Group>
                    </Col>
                    <Col md="6 mb-2">
                        <Form.Group controlId="codeBinaPassword">
                            <Form.Label>סיסמא קוד בינה</Form.Label>
                            <Form.Control
                                type="password"
                                disabled={!fillCodeBina}
                                defaultValue={business.codeBina.password}
                                {...(fillCodeBina ?
                                    register("codeBina.password", {
                                        required: "שדה זה הינו חובה.",
                                        maxLength: {
                                            value: 64,
                                            message: "ערך מקסימלי של 64 תווים"
                                        }
                                    }) : {}
                                )}
                            />
                            {errors.codeBina?.password && <p className="text-danger">{errors.codeBina.password.message}</p>}
                        </Form.Group>
                    </Col>
                    <Col md="6 mb-2">
                        {/* Name Input */}
                        <Form.Group controlId="customerNoInBina">
                            <Form.Label>מזהה לקוח קוד בינה</Form.Label>
                            <Form.Control
                                type="number"
                                disabled={!fillCodeBina}
                                defaultValue={business.codeBina.customerNo}
                                {...(fillCodeBina ?
                                    register("codeBina.customerNo", {
                                        valueAsNumber: true,
                                        required: "שדה זה הינו חובה.",
                                        min: {
                                            value: 1,
                                            message: "הערך המינימלי הוא 1"
                                        }
                                    }) : {}
                                )}
                            />
                            {errors.codeBina?.customerNo && <p className="text-danger">{errors.codeBina.customerNo.message}</p>}
                        </Form.Group>
                    </Col></>}


                <Col md="12 pt-2">
                    <Button variant="primary" type="submit">
                        אישור
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}


function CodeBinaForm(props) {
    const [codeBina, setCodeBina] = useState(props.codeBina ?? { host: "", user: "", password: "", customerNo: 0 });

    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

    const onSubmit = data => {
        if (!props.onSubmit) return
        if (props.codeBina)
            data.businessId = props.codeBina.businessId

        props.onSubmit(data);
    };

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
                <Col md="6 mb-2">
                    {/* Name Input */}
                    <Form.Group controlId="host">
                        <Form.Label>מארח קוד בינה</Form.Label>
                        <Form.Control
                            type="text"
                            defaultValue={codeBina.host}
                            {...register("host", {
                                required: "שדה זה הינו חובה.",
                                pattern: {
                                    value: /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i,
                                    message: "כתובת לא חוקית"
                                }
                            }
                            )}
                        />
                        {errors.host && <p className="text-danger">{errors.host.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6 mb-2">
                    {/* Name Input */}
                    <Form.Group controlId="user">
                        <Form.Label>משתמש קוד בינה</Form.Label>
                        <Form.Control
                            type="text"
                            defaultValue={codeBina.user}
                            {...register("user", {
                                required: "שדה זה הינו חובה.",
                                maxLength: {
                                    value: 64,
                                    message: "ערך מקסימלי של 64 תווים"
                                }
                            }
                            )}
                        />
                        {errors.user && <p className="text-danger">{errors.user.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6 mb-2">
                    <Form.Group controlId="password">
                        <Form.Label>סיסמא קוד בינה</Form.Label>
                        <Form.Control
                            type="password"
                            defaultValue={codeBina.password}
                            {...register("password", {
                                required: "שדה זה הינו חובה.",
                                maxLength: {
                                    value: 64,
                                    message: "ערך מקסימלי של 64 תווים"
                                }
                            }
                            )}
                        />
                        {errors.password && <p className="text-danger">{errors.password.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6 mb-2">
                    {/* Name Input */}
                    <Form.Group controlId="customerNo">
                        <Form.Label>מזהה לקוח קוד בינה</Form.Label>
                        <Form.Control
                            type="number"
                            defaultValue={codeBina.customerNo}
                            {...register("customerNo", {
                                valueAsNumber: true,
                                required: "שדה זה הינו חובה.",
                                min: {
                                    value: 1,
                                    message: "הערך המינימלי הוא 1"
                                }
                            }
                            )}
                        />
                        {errors.customerNo && <p className="text-danger">{errors.customerNo.message}</p>}
                    </Form.Group>
                </Col>


                <Col md="12 pt-2">
                    <Button variant="primary" type="submit">
                        אישור
                    </Button>
                </Col>
            </Row>
        </Form>
    );
}



function BusinessesTable(props) {
    const users = React.useMemo(() => {
        const reversedUsers = [...props.businesses].reverse()
        return reversedUsers.map((business, index) => {
            return {
                ...business,
                index: index + 1 // Reversing the index directly
            };
        });
    }, [props.businesses]);

    function DefaultColumnFilter({
        column: { filterValue, preFilteredRows, setFilter },
    }) {
        const count = preFilteredRows.length;

        return (
            <input className="form-control"
                value={filterValue || ''}
                onChange={e => {
                    setFilter(e.target.value || undefined);
                }}
                placeholder={`חפש...`}
            />
        );
    }

    const columns = React.useMemo(
        () => [
            { Header: "#", accessor: "index" },
            { Header: "מזהה", accessor: "id" },
            { Header: "שם", accessor: "name" },
            { Header: "אימייל", accessor: "email" },
            {
                Header: 'פעולות',
                Cell: ({ row }) => (
                    <ButtonGroup>
                        <Button size="sm" onClick={() => props.onEdit(row.original)}>עריכה</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDelete(row.original)}>מחיקה</Button>
                    </ButtonGroup>
                ),
                disableFilters: true,
            },
        ],
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        page,
        prepareRow,
        canPreviousPage,
        canNextPage,
        pageOptions,
        nextPage,
        previousPage,
        state: { pageIndex, pageSize },
        setPageSize,
        setFilter,
    } = useTable(
        {
            columns,
            data: users,  // <-- Using users state variable as data source
            initialState: { pageIndex: 0, pageSize: 10 },
            defaultColumn: { Filter: DefaultColumnFilter },
        },
        useFilters,
        useSortBy,
        usePagination
    );

    const [showFilters, setShowFilters] = useState(false)

    const handleDelete = async (user) => {
        props.onDelete(user)
    };

    return (
        <>
            <div className="table-responsive">
                <div className="d-flex align-items-end ps-1">
                    <div className="me-2">
                        <label>שורות: </label>
                        <select className="form-control"
                            value={pageSize}
                            onChange={e => {
                                setPageSize(Number(e.target.value));
                            }}
                        >
                            {[10, 30, 50, 100].map(size => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button className="me-2" size="sm" variant="info" onClick={() => setShowFilters(prevShow => !prevShow)}>
                        {showFilters ? "הסתר מסננים" : "הצג מסננים"}
                    </Button>
                    {props.children}
                </div>
                <table className="table table-striped" {...getTableProps()}>
                    <thead>
                        {headerGroups.map(headerGroup => (
                            <tr {...headerGroup.getHeaderGroupProps()}>
                                {headerGroup.headers.map(column => (
                                    <th {...column.getHeaderProps()} className="no-select">
                                        <div {...column.getSortByToggleProps()}>
                                            {column.render('Header')}
                                            <span>
                                                {column.isSorted
                                                    ? column.isSortedDesc
                                                        ? ' 🔽'
                                                        : ' 🔼'
                                                    : ''}
                                            </span>
                                        </div>
                                        {/* Render filter UI */}
                                        {showFilters ? column.canFilter ? column.render('Filter') : null : null}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody {...getTableBodyProps()}>
                        {page.map(row => {
                            prepareRow(row);
                            return (
                                <tr {...row.getRowProps()}>
                                    {row.cells.map(cell => (
                                        <td {...cell.getCellProps()}>{cell.render("Cell")}</td>
                                    ))}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {/* Pagination */}
                <div>
                    <Button onClick={() => previousPage()} disabled={!canPreviousPage}>
                        הקודם
                    </Button>{" "}
                    <Button onClick={() => nextPage()} disabled={!canNextPage}>
                        הבא
                    </Button>{" "}
                    <span>
                        עמוד{" "}
                        <strong>
                            {pageIndex + 1} מ {pageOptions.length}
                        </strong>{" "}
                    </span>
                </div>
            </div>
        </>
    )
}