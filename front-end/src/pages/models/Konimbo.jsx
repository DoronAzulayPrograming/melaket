import React from "react";
import "./Konimbo.css"

import Spinner from 'react-bootstrap/Spinner';

import {
    ModelsApi,
    BusinessApi,
    KonimboApi,
    CheetahApi,
    BasePath,
} from "../../core/Api/MelaketApi"

import { AuthContext, Authorized } from "../../core/AuthProvider"
import { Alert, Button, ButtonGroup, Card, Col, Container, Form, ListGroup, ListGroupItem, Modal, Row } from "react-bootstrap";
import { toast } from "react-toastify";

import AutocompleteInput from "../../components/AutocompleteInput"

import { useForm } from 'react-hook-form';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleCheck, faTimesCircle } from '@fortawesome/free-solid-svg-icons'
import Loader from "../../components/Loader";

import { JSPrintManager,WSStatus, ClientPrintJob, InstalledPrinter, PrintFile, FileSourceType } from "jsprintmanager"
import html2canvas from 'html2canvas';

const PageContext = React.createContext();
function PageContextProvider({ children }) {
    const [activeWarehouse, setActiveWarehouse] = React.useState(null)
    const [business, setBusiness] = React.useState(null)
    const [orders, setOrders] = React.useState([])
    const [modelData, setModelData] = React.useState({})
    const [pickupStatus, setPickupStatus] = React.useState(false)
    
    function Connect(){
      if (JSPrintManager.websocket_status == WSStatus.Open)
        return;
    
      JSPrintManager.license_url = BasePath + "/" + "jsprintmanager" //"https://jsprintmanager.azurewebsites.net/licenses/jsprintmanager";
      JSPrintManager.auto_reconnect = true
      JSPrintManager.start()
    }

    function Status() {
      if (JSPrintManager.websocket_status == WSStatus.Open)
        return true;
      else if (JSPrintManager.websocket_status == WSStatus.Closed) {
        toast.error('JSPrintManager (JSPM) is not installed or not running! Download JSPM Client App v6.0.3');
        return false;
      }
      else if (JSPrintManager.websocket_status == WSStatus.Blocked) {
        toast.warning('JSPM has blocked this website!');
        return false;
      }
    }


    return (
        <PageContext.Provider value={{jsPM:{Connect, Status}, activeWarehouse, setActiveWarehouse, business, setBusiness, orders, setOrders, modelData, setModelData, pickupStatus, setPickupStatus }}>
            {children}
        </PageContext.Provider>
    );
}

function Konimbo() {

    return (
        <PageContextProvider>
            <KonimboLoader />
        </PageContextProvider>
    )
}

function KonimboLoader() {
  const [loading, setLoading] = React.useState(false)
  const { jsPM, setModelData, setBusiness } = React.useContext(PageContext)
  const { user } = React.useContext(AuthContext)
    
    React.useEffect(() => {
        if(user.printers.length > 0){
          jsPM.Connect()
          jsPM.Status()
        }

        const load = async () => {
          setLoading(true)
            let res = await ModelsApi.setAuthHeader(user.token).loadKonimboAsync()
            res.cheetah = res.cheetah.map(i => {
                return { ...i, id: i.lockerCode, name: i.lockerText }
            })
            setModelData(res)

            const b = await BusinessApi.setAuthHeader(user.token).getCurrent();
            setBusiness(b)

            setLoading(false)
        }
        load()

    }, [])

    if(loading) return <Loader />

    return (<KonimboPage />)
}

function KonimboPage() {
    const [isLoading, setIsLoading] = React.useState(false)
    const { setOrders, setPickupStatus, business, setActiveWarehouse } = React.useContext(PageContext)
    const { user } = React.useContext(AuthContext)
    
    React.useEffect(() => {

        if (user.warehouses && user.warehouses.length > 0) {
            handleTopbarChange(user.warehouses[0].warehouseId, false)
        }

    }, [business])

    async function handleTopbarChange(warehouseId, pickupStatus) {

        if (!pickupStatus)
            setActiveWarehouse(user.warehouses.find(w => w.warehouseId == warehouseId))
        else setActiveWarehouse(null)

        setPickupStatus(pickupStatus)
        if (!business) return

        setIsLoading(true)
        let status = ""
        const model = business.models.find(m => m.name === "קונימבו")

        if (warehouseId === -1) {
            status = model.data.failedOrderStatus
        } else {
            const warehouse = model.data.warehouses.find(w => w.warehouseId === warehouseId)
            status = !pickupStatus ? warehouse.orderStatus : warehouse.pickupStatus;
        }

        try {
            const res = await KonimboApi.setAuthHeader(user.token).getOrders(status)
            //setActiveOrders(res)
            setOrders(res)

            //console.log(res)
        } catch (error) {
            console.error(error.message)
        }

        setIsLoading(false)
    }

    function getUserWarehouses() {
        const warehouses = user.warehouses.map(w => {
            return { warehouseId: w.warehouseId, warehouseName: w.warehouseName }
        })

        if (user.roles.includes("subAdmin") || user.roles.includes("manager"))
            return [...warehouses, { warehouseId: -1, warehouseName: "ללא מחסן" }]

        return warehouses
    }

    function getKonimboData() {
        return business.models.find(m => m.name === "קונימבו").data
    }

    return (
        <>
            {business && <>
                    <TopBar
                        onChange={handleTopbarChange}
                        warehouses={getUserWarehouses()}
                    />
                    {isLoading && <div className="h-75 d-flex justify-content-center align-items-center">
                        <Spinner animation="grow" variant="info" className="me-4 shadow" />
                        <Spinner animation="grow" variant="warning" className="me-4 shadow" />
                        <Spinner animation="grow" variant="info" className=" shadow" />
                    </div>}
                    {!isLoading && <OrdersTable modelData={getKonimboData()} />}
            </>}
        </>
    )

}




function OrdersTable(props) {
    const { orders, pickupStatus } = React.useContext(PageContext)

    return (
        <div className="">
            <table className="table table-responsive">
                <thead>
                    <tr>
                        <th className="col col-2">הזמנה</th>
                        <th className="col col-8">פריטים</th>
                        <th className="col col-2">פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.filter(i => pickupStatus ? true :
                        i.payment_status.includes("מלא"))
                        .map((i, key) => <OrderRow key={i.id} modelData={props.modelData} order={i} />)}
                </tbody>
            </table>
        </div>
    )
}

function OrderRow(props) {
    const { user } = React.useContext(AuthContext)
    const { jsPM,activeWarehouse, business, orders, setOrders } = React.useContext(PageContext)

    const [modalShowMode, setModalShowMode] = React.useState("NONE")
    const [loading, setLoading] = React.useState(false)
    const [loadingMsgs, setLoadingMsgs] = React.useState([])

    const [shipmentStickerUrl, setShipmentStickerUrl] = React.useState("")
    const [shipmentIsPrint, setShipmentIsPrint] = React.useState(false)
    const [invoiceIsPrint, setInvoiceIsPrint] = React.useState(false)
    const [invoiceData, setInvoiceData] = React.useState(null)

    const [itemsData, setItemsData] = React.useState([])

    const [packageAmount, setPackageAmount] = React.useState(1)
    const [bigOrder, setBigOrder] = React.useState(false)
    const [copyNoteToShipping, setCopyNoteToShipping] = React.useState(false)
    const [sendTrackingMailToCustomer, setSendTrackingMailToCustomer] = React.useState(true)

    const [isRowValid, setIsRowValid] = React.useState(false)
    const [shipping, handleSetShipping] = React.useState({ isValid: false })

    const [content, setContent] = React.useState(null);
    const contentRef = React.useRef(null);

    React.useEffect(() => {
        let data = []
        props.order.items.filter(i => !i.type?.includes("shipping")).forEach(item => {
            let itemData = {
                line_item_id: item.line_item_id,
                isValid: false,
                barcode: "",
                serialNumbers: []
            }

            for (let i = 0; i < item.quantity; i++) itemData.serialNumbers.push("")

            data.push(itemData)

        })

        if (props.modelData.codeBinaPickupItemNumber === props.order.shipping.code){
            handleSetShipping(prev => { return { ...prev, isValid: true } })
        }

        setItemsData(data)
    }, [orders])

    React.useEffect(() => {
        handleValidRow()
    }, [orders, itemsData, shipping])

    function handleValidRow() {
        let status = true;
        for (let i = 0; i < itemsData.length; i++) {

            if (!itemsData[i].isValid) {
                status = false
                break;
            }
        }
        
        let value = status && shipping.isValid
        if (isRowValid !== value)
            setIsRowValid(value)
    }

    function deepEqual(obj1, obj2) {
        if (obj1 === obj2) {
            return true; // if both are same reference or same primitive value
        }

        if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
            return false; // if either is not an object or is null
        }

        let keys1 = Object.keys(obj1);
        let keys2 = Object.keys(obj2);

        if (keys1.length !== keys2.length) {
            return false; // different number of properties
        }

        for (let key of keys1) {
            if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
                return false; // different properties or property values
            }
        }

        return true;
    }

    function setShippingAddress(value) {
        if (!deepEqual(shipping.data, value))
            handleSetShipping(prev => { return { ...prev, data: value } })
    }

    function setShippingValid(value) {
        if (shipping.isValid !== value)
            handleSetShipping(prev => { return { ...prev, isValid: value } })
    }

    function handleSubmit(data) {
        const shippingShereParams = {
            sendTrackingMailToCustomer,
            code: props.order.shipping.code,
            price: props.order.shipping.price,
            title: props.order.shipping.title
        }
        setLoading(true)
        if (shippingShereParams.code == props.modelData.codeBinaPointItemNumber)
            onSubmit({
                orderId: props.order.id, shippingPoint: shipping.data.point, items: itemsData, shipping: {
                    packageAmount: 1,
                    ...shippingShereParams,
                }
            })
        else if (shippingShereParams.code == props.modelData.codeBinaB2CItemNumber)
            onSubmit({
                orderId: props.order.id, shippingAddress: shipping.data, items: itemsData, shipping: {
                    bigOrder,
                    packageAmount: packageAmount,
                    copyNoteToShipping,
                    ...shippingShereParams,
                }
            })
        else if (shippingShereParams.code == props.modelData.codeBinaPickupItemNumber)
            onSubmit({
                orderId: props.order.id, items: itemsData, shipping: {
                    ...shippingShereParams,
                }
            })
        else setLoading(true)
    }

    async function onSubmit(data) {

        [...data.items].forEach(item => {
            item.serialNumbers = item.serialNumbers.filter(si => si != "")
        });


        data = {
            ...data,
            credit_card_details: props.order.credit_card_details,
            codeBinaPaypalCashier: props.modelData.codeBinaPaypalCashier,
            codeBinaCreditCashier: props.modelData.codeBinaCreditCashier,
            paymentStatus: props.order.payment_status,
            codeBinaB2CHarigItemNumber: props.modelData.codeBinaB2CHarigItemNumber,
            codeBinaDiscountItemNumber: props.modelData.codeBinaDiscountItemNumber,
            discountsInvoice: props.order.discounts,
            itemsInvoice: props.order.items,
            codeBinaCustomerNo: props.modelData.codeBinaCustomerNo,
            warehouse: activeWarehouse,
            totalPrice: props.order.total_price,
            phone: props.order.phone,
            name: props.order.name,
            additionalInputs: { ...props.order.additional_inputs }
        }


        const konimboActiveWarehouse = props.modelData.warehouses.find(w => w.warehouseId === activeWarehouse.warehouseId)
        if (!konimboActiveWarehouse) {
            toast.error("לא נמצא מחסן זהה במודל קונימבו")
            return
        }

        /*
            console.log(data)
            console.log(props.order)
        */

        //Step 1
        let payment = true
        if (data.paymentStatus == 'אשראי - מלא' || data.paymentStatus == 'applepay - מלא' || data.paymentStatus == 'googlepay - מלא' || data.paymentStatus == 'Apple pay - מלא' || data.paymentStatus == 'Google pay - מלא') {
            
            setLoadingMsgs(prev => [...prev, "מתחיל חיוב אשראי..."])
            
            try {
                const response = await KonimboApi.setAuthHeader(user.token).debitOrder(data.orderId, { totalPrice: props.order.total_price })
                let res = await response.json()

                if (!res.result) {
                    setLoading(false)
                    setLoadingMsgs(prev => [...prev, "הזמנה לא חוייבה!"])

                    payment = false

                    let body = {
                        token: props.modelData.orderToken,
                        status: props.modelData.failedOrderStatus,
                        text: `<b>שגיאת מערכת ליקוט - חיוב נכשל</b> - [משתמש: ${user.name}]`,
                    }


                    try {
                        await KonimboApi.setAuthHeader(user.token).updateStatus(data.orderId, body)
                    } catch (error) {
                        setLoading(false)
                        console.error(error)
                        setLoadingMsgs(prev => [...prev, "הזמנה לא עודכנה בקונימבו!"])
                        return
                    }
                    setLoading(false)
                    return
                }

                setLoadingMsgs(prev => [...prev.slice(0, prev.length-1), "הזמנה חוייבה בהצלחה."])

            } catch (error) {

                setLoading(false)
                setLoadingMsgs(prev => [...prev.slice(0, prev.length-1), "הזמנה לא חוייבה!"])
                payment = false
                console.error(error)
                return
            }
        }

        //Step 2
        setLoadingMsgs(prev => [...prev, "מתחיל הפקת חשבונית..."])
        let invoiceNo = 0;
        try {
            const response = await KonimboApi.setAuthHeader(user.token).invoice(data.orderId, data)

            const result = await response.json()
            setInvoiceData(result)

            invoiceNo = Number(result.invoiceNo)
            setLoadingMsgs(prev => [...prev.slice(0, prev.length-1), `חשבונית מס ${invoiceNo} הופקה בהצלחה.`])
            if(!result.url){
                setLoadingMsgs(prev => [...prev, `עליך להדפיס את החשבוית ידני מקוד בינה!`])
            }
        } catch (error) {

            setLoading(false)
            setLoadingMsgs(prev => [...prev.slice(0, prev.length-1), "לא הופקה חשבונית!"])

            let body = {
                token: props.modelData.orderToken,
                status: props.modelData.failedOrderStatus,
                text: `<b>שגיאת מערכת ליקוט - הפקת חשבונית נכשלה</b> - [משתמש: ${user.name}] </br> [שגיאה: ${error}]`,
            }

            try {
                await KonimboApi.setAuthHeader(user.token).updateStatus(data.orderId, body)
            } catch (error) {
                console.error(error)
                setLoading(false)
                setLoadingMsgs(prev => [...prev, "הזמנה לא עודכנה בקונימבו!"])
                return
            }
            setLoading(false)
            return
        }

        //Step 3
        let shippingData = {}
        if (data.shipping.code == props.modelData.codeBinaB2CItemNumber || data.shipping.code == props.modelData.codeBinaPointItemNumber) {
            setLoadingMsgs(prev => [...prev, "מתחיל הפקת שובר משלוח..."])
            const warehouse = props.modelData.warehouses.find(w => w.warehouseId === activeWarehouse.warehouseId)

            let shippmentData = {
                codeBinaB2CItemNumber: props.modelData.codeBinaB2CItemNumber,
                codeBinaPointItemNumber: props.modelData.codeBinaPointItemNumber,

                shippingAuth: warehouse.shippingAuth,
                shopName: props.modelData.shopName,
                orderId: data.orderId,
                name: props.order.name,
                phone: props.order.phone,
                email: props.order.email,
                notes: props.order.note,
                shippingCode: data.shipping.code,

            }

            if (data.shipping.bigOrder !== undefined)
                shippmentData.bigOrder = data.shipping.bigOrder

            if (data.shipping.packageAmount !== undefined)
                shippmentData.packageAmount = data.shipping.packageAmount

            if (data.shipping.copyNoteToShipping !== undefined)
                shippmentData.copyNoteToShipping = data.shipping.copyNoteToShipping

            if (data.shippingPoint) {
                shippmentData.chitaPoint = {
                    point: data.shippingPoint,
                    cityName: shipping.data.cityName
                }
            }
            else shippmentData.address = data.shippingAddress

            try {
                const response = await CheetahApi.setAuthHeader(user.token).createShipment(business.id, shippmentData)

                if (!response.ok) {

                    setLoading(false)
                    setLoadingMsgs(prev => [...prev.slice(0, prev.length - 1), "הפקת שובר משלוח נכשלה!"])

                    let body = {
                        token: props.modelData.orderToken,
                        status: props.modelData.failedOrderStatus,
                        text: `<b>שגיאת מערכת ליקוט - הפקת שובר משלוח נכשלה</b> - [משתמש: ${user.name}]`,
                    }

                    if (response.status == 404) {
                        let obj = response.json()
                        console.error(obj.shipment_tracking)
                        body.text += `</br> [שגיאה: ${obj.shipment_tracking}]`
                    }


                    try {
                        await KonimboApi.setAuthHeader(user.token).updateStatus(data.orderId, body)
                    } catch (error) {
                        setLoading(false)
                        console.error(error)
                        setLoadingMsgs(prev => [...prev, "הזמנה לא עודכנה בקונימבו!"])
                        return
                    }
                    setLoading(false)
                    return
                }

                shippingData = await response.json()
                setShipmentStickerUrl(prev => prev + shippingData.shipment_id)

            } catch (error) {
                setLoadingMsgs(prev => [...prev.slice(0, prev.length - 1), "הפקת שובר משלוח נכשלה!"])
                console.error(error)
            }
            setLoadingMsgs(prev => [...prev.slice(0, prev.length - 1), `משלוח הופק בהצלחה מס: ${shippingData.shipment_id}.`])
        }

        /* Todo:
        - Sending email to the customer (if the checkbox is chcked-on)
        */

        let tamplate = ""
        let prefix = '<html lang="he-IL"><head><meta charset="utf-8"></head><body dir="rtl" style="font-family:Arial,Helvetica,sans-serif;">'
        let endFix = props.modelData.sendGridSignature + '</body></html>'


        let bodyStatus = props.modelData.finalOrderStatus
        let subjectMsg = `הזמנתך מס' #${props.order.id}`

        if (data.shippingPoint) {
            tamplate = props.modelData.sendGridTemplatePoint
            subjectMsg += `נשלחה | תודה שקנית ב-${props.modelData.shopName}`
            tamplate = tamplate.replace("{shipmentPoint}", shipping.data.name)
            tamplate = tamplate.replace("{shipmentTracking}", shippingData.shipment_tracking)
        } else if (data.shippingAddress) {
            tamplate = props.modelData.sendGridTemplateB2C
            subjectMsg += `נשלחה | תודה שקנית ב-${props.modelData.shopName}`
            tamplate = tamplate.replace("{shipmentTracking}", shippingData.shipment_tracking)
        } else {
            tamplate = props.modelData.sendGridTemplatePickup
            bodyStatus = konimboActiveWarehouse.pickupStatus
            subjectMsg += `מוכנה לאיסוף עצמי | תודה שקנית ב-${props.modelData.shopName}`
            tamplate = tamplate.replace("{warehouseAddress}", konimboActiveWarehouse.address)
        }

        tamplate = tamplate.replace("{orderId}", props.order.id)
        tamplate = tamplate.replace("{customerName}", props.order.name)
        tamplate = tamplate.replace("{shopName}", props.modelData.shopName)

        let responseText = ""
        if (sendTrackingMailToCustomer) {
            setLoadingMsgs(prev => [...prev, "מתחיל שליחת מייל ללקוח..."])
            try {
                const response = await KonimboApi.setAuthHeader(user.token).sendEmail({
                    shopName: props.modelData.shopName,
                    email: props.order.email, //props.order.email
                    subject: subjectMsg,
                    tamplate: prefix + tamplate + endFix,
                    sendGrid: {
                        token: props.modelData.sendGridToken,
                        email: props.modelData.sendGridEmail
                    }
                })

                if(response.ok){
                    responseText = await response.text()
                    setLoadingMsgs(prev => [...prev.slice(0, prev.length - 1), "נשלח מייל ללקוח בהצלחה."])
                }else{
                    setLoadingMsgs(prev => [...prev.slice(0, prev.length - 1), "לא נשלח מייל ללקוח!"])
                }

            } catch (error) {
                console.error(error)
            }
        }

        let body = {
            token: props.modelData.orderToken,
            status: bodyStatus,
            invoice: invoiceNo,
            text: `${tamplate} </br> ` + (responseText ? "<b>תשובה מ-Send Grid:</b>" + responseText : "") + ` - [משתמש: ${user.name}]`,
        }

        if (shippingData.shipment_tracking)
            body.shipment_tracking = shippingData.shipment_tracking

        try {
            await KonimboApi.setAuthHeader(user.token).updateStatus(data.orderId, body)
        } catch (error) {
            console.error(error)
            setLoadingMsgs(prev => [...prev, "הזמנה לא עודכנה בקונימבו!"])
            setLoading(false)
            return
        }

        setLoading(false)
        /*
        - Button to print invoice (saving a json of the codebina we send before)

        - Button to close the row , which will be enabled only after printing invoice & shipping
        */

        //Step 4

    }

    function getCancelOrderReasons() {
        if (typeof props.modelData.cancelOrderReasons !== "string") return []

        return props.modelData.cancelOrderReasons.split(",") ?? []
    }

    async function handleCancelOrder(reason) {
        let body = {
            token: props.modelData.orderToken,
            status: props.modelData.failedOrderStatus,
            text: `<b>לא ניתן ללקט</b> - [משתמש: ${user.name}] </br> [סיבה: ${reason}]`,
        }

        try {
            await KonimboApi.setAuthHeader(user.token).updateStatus(props.order.id, body)

            setOrders(prev => prev.filter(o => o.id !== props.order.id))

            toast.success("הזמנה בוטלה בהצלחה")
            setModalShowMode("NONE")
        } catch (error) {
            toast.error(error)
            return
        }
    }

    function getWarehouses() {
        return user.warehouses.filter(w => w.warehouseId !== activeWarehouse.warehouseId).map((w) => {
            return {
                orderStatus: props.modelData.warehouses.find(bw => bw.warehouseId == w.warehouseId).orderStatus,
                warehouseName: w.warehouseName,
            }
        })

    }

    async function handleTransferOrder(warehouseOrderStatus) {
        let body = {
            token: props.modelData.orderToken,
            status: warehouseOrderStatus,
            text: `<b>העברת מחסן</b> - [משתמש: ${user.name}]`,
        }

        try {
            await KonimboApi.setAuthHeader(user.token).updateStatus(props.order.id, body)

            setOrders(prev => prev.filter(o => o.id !== props.order.id))

            toast.success("הזמנה הועברה בהצלחה")
            setModalShowMode("NONE")
        } catch (error) {
            toast.error(error)
            return
        }
    }

    function getLoadingMsgClass(msg){
        if(msg.endsWith("...")) return "text-info"
        else if(msg.endsWith(".")) return "text-success"
        else if(msg.endsWith("!")) return "text-danger"
        else return ""
    }

    function handleCloseRow(){
        setOrders(prev => prev.filter(o => o.id !== props.order.id))
        toast.success("הזמנה לוקטה בהצלחה.")
    }

    function handlePrintInvoiceClick(){
        setInvoiceIsPrint(true)
        if(user.printers.length > 0 && user.printers.split(",")[0]){
            if(jsPM.Status()){
                printInvoice()
            } else jsPM.Connect()
        }
    }

    React.useEffect(() => {
        if (contentRef.current.children.length < 1) return
        JSMPrintInvoice()
    }, [content])

    function JSMPrintInvoice(){
        contentRef.current.style.display = "block";
        html2canvas(contentRef.current, { 
            scale: 3
            })
            .then(function (canvas) {
            var cpj = new ClientPrintJob();
            cpj.clientPrinter = new InstalledPrinter(user.printers.split(",")[0]);
            var b64Prefix = "data:image/png;base64,";
            var imgBase64DataUri = canvas.toDataURL("image/png");

            var imgBase64Content = imgBase64DataUri.substring(b64Prefix.length, imgBase64DataUri.length);
            var myImageFile = new PrintFile(imgBase64Content, FileSourceType.Base64, props.order.id + '.png', 1);
            cpj.files.push(myImageFile);
            cpj.sendToClient();
        }).finally(() => { contentRef.current.style.display = "none"; });
    }
    function printInvoice(){
        //"http://localhost:5000/invoices/konimbo/v2IF2Q_f4VU,"
        fetch(BasePath + "/" + invoiceData.url).then((response) => response.text()).then((data) => {
            const parser = new DOMParser();
            const htmlDocument = parser.parseFromString(data, 'text/html');
            const card = htmlDocument.getElementById('card');
            if(content == null)
                setContent(card.innerHTML);
            else JSMPrintInvoice()
        } )
    }
    function renderPrintInvoiceButton(){
        if(user.printers.length > 0 && user.printers.split(",")[0])
            return <Button variant="light" onClick={handlePrintInvoiceClick} onAuxClick={handlePrintInvoiceClick}> הדפס חשבונית</Button>
                                        
        return <a className="btn btn-light" onClick={() => { setInvoiceIsPrint(true) }} onAuxClick={() => { setInvoiceIsPrint(true) }} target="_blank" href={BasePath + "/" + invoiceData.url}> הדפס חשבונית</a>
    }

    function handlePrintCheetahClick(){
        setShipmentIsPrint(true)
        if(user.printers.length > 0 && user.printers.split(",")[1]){
            if(jsPM.Status()){
                printCheetah()
            } else jsPM.Connect()
        }
    }
    function printCheetah(){
        // Cheetah Printing
        var cpj = new ClientPrintJob();
        cpj.clientPrinter = new InstalledPrinter(user.printers.split(",")[1]);
        var myPDF = new JSPM.PrintFilePDF("https://chita-il.com/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=-N" + shipmentStickerUrl, FileSourceType.ExternalURL, 'MyFile.pdf', 1);
        cpj.files.push(myPDF);
        cpj.sendToClient();
    }
    function renderPrintCheetahButton(){
        if(user.printers.length > 0 && user.printers.split(",")[1])
            return <Button variant="light" onClick={handlePrintCheetahClick} onAuxClick={handlePrintCheetahClick}> הדפס שובר משלוח</Button>
                                        
        return <a className="btn btn-light" onClick={() => { setShipmentIsPrint(true) }} onAuxClick={() => { setShipmentIsPrint(true) }} target="_blank" href={"https://chita-il.com/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ship_print_ws&ARGUMENTS=-N" + shipmentStickerUrl}> הדפס שובר משלוח</a>
    }

    return (<>
        <tr>
            <td><OrderRowDetails helpers={{ setShippingValid, setShippingAddress }} modelData={props.modelData} order={props.order} /></td>
            <td><OrderItems helpers={{ itemsData, setItemsData }} items={props.order.items ?? []} /></td>
            <td>
                <Card>
                    <Card.Header><b>סיום הזמנה</b></Card.Header>
                    <Card.Body className="bg-secondary-subtle">
                        {!loading && loadingMsgs.length == 0 && <>
                            {isRowValid && <Alert variant="success">
                                {shipping.data && typeof shipping.data.point !== "number" && <>
                                    {props.order.note &&
                                        <Form.Check
                                            className="user-select-none"
                                            id={"copyNoteToShipping-" + props.order.id}
                                            label="העתק הערות למשלוח"
                                            checked={copyNoteToShipping}
                                            onChange={(e) => setCopyNoteToShipping(e.target.checked)}
                                        />}
                                    <Form.Check
                                        className="user-select-none"
                                        id={"bigOrder-" + props.order.id}
                                        label='חבילה חריגה (מעל 25 ק"ג)'
                                        checked={bigOrder}
                                        onChange={(e) => setBigOrder(e.target.checked)}
                                    />
                                    <Container className="user-select-none">
                                        <Row className="align-items-center m-0">
                                            <Col sm="7" className="p-0">
                                                <Form.Label htmlFor={"packageAmount-" + props.order.id} className="m-0">מספר חבילות:</Form.Label>
                                            </Col>
                                            <Col sm="5" className="p-0">
                                                <Form.Control
                                                    id={"packageAmount-" + props.order.id}
                                                    as="select"
                                                    value={packageAmount}
                                                    onChange={(e) => setPackageAmount(Number(e.target.value))}
                                                >
                                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((item, key) => <option key={key} value={item}>{item}</option>)}
                                                </Form.Control>
                                            </Col>
                                        </Row>
                                    </Container>
                                </>}
                                <Form.Check
                                    className="user-select-none"
                                    id={"sendTrackingMailToCustomer-" + props.order.id}
                                    label="שלח מייל מעקב ללקוח"
                                    checked={sendTrackingMailToCustomer}
                                    onChange={(e) => setSendTrackingMailToCustomer(e.target.checked)}
                                />
                            </Alert>}
                            <div className="d-flex justify-content-center mb-2">
                                <ButtonGroup>
                                    <Authorized roles={["subAdmin", "manager"]}>
                                        {!isRowValid && <Button onClick={() => setModalShowMode("ADMIN_LOG")} size="sm" variant="info">היסטוריה</Button>}
                                        {!isRowValid && <Button onClick={() => setModalShowMode("TRANSFER")} size="sm" variant="warning">העבר מחסן</Button>}
                                    </Authorized>
                                    {!isRowValid && <Button onClick={() => setModalShowMode("CANCEL_ORDER")} size="sm" variant="danger">לא ניתן ללקט</Button>}
                                    {isRowValid && <Button disabled={!isRowValid} onClick={handleSubmit} size="sm">סיום ליקוט</Button>}
                                </ButtonGroup>
                            </div>

                        </>}
                        <div>

                            {loadingMsgs.length > 0 &&

                                <ul>
                                    {loadingMsgs.map((msg, key) => <li className={getLoadingMsgClass(msg)} key={key}>{msg}</li>)}
                                </ul>
                            }

                            {loading &&
                                <div className="h-75 d-flex justify-content-center align-items-center">
                                    <Spinner animation="grow" variant="info" className="me-4 shadow" />
                                    <Spinner animation="grow" variant="warning" className="me-4 shadow" />
                                    <Spinner animation="grow" variant="info" className=" shadow" />
                                </div>
                            }

                        </div>
                        <div>

                        <div style={{position:"absolute",right:"100%"}} ref={contentRef} data-size="A4" dangerouslySetInnerHTML={{ __html: content }} />
                            {!loading && loadingMsgs.length > 0 && <>
                                <ButtonGroup>
                                    {invoiceData && invoiceData.url && <>{renderPrintInvoiceButton()}</>}

                                    {shipmentStickerUrl && <>{renderPrintCheetahButton()}</>}
                                </ButtonGroup>


                                {(shipmentIsPrint || props.modelData.codeBinaPickupItemNumber === props.order.shipping.code) && (invoiceIsPrint || !invoiceData.url) && <>
                                    <Button className="mt-2" onClick={handleCloseRow} variant="danger">סגור</Button>
                                </>
                             }
                             </>}
                        </div>
                    </Card.Body>
                </Card>
            </td>
        </tr>

        <Modal
            show={modalShowMode !== "NONE"}
            onHide={() => setModalShowMode("NONE")}

            size={(modalShowMode === "ADMIN_LOG" ? "xl" : "md")}
            aria-labelledby="contained-modal-title-vcenter"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title id="contained-modal-title-vcenter">
                    {modalShowMode === "CANCEL_ORDER" && <span>לא ניתן ללקט</span>}
                    {modalShowMode === "TRANSFER" && <span>העברת מחסן</span>}
                    {modalShowMode === "ADMIN_LOG" && <span>היסטוריה</span>}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {modalShowMode === "CANCEL_ORDER" && <LikotDontWork onSubmit={handleCancelOrder} list={getCancelOrderReasons()} />}
                {modalShowMode === "TRANSFER" && <TransferOrder list={getWarehouses()} onSubmit={handleTransferOrder} />}
                {modalShowMode === "ADMIN_LOG" && <OrderAdminLog info={props.order} />}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setModalShowMode("NONE")}>סגירה</Button>
            </Modal.Footer>
        </Modal>
    </>)
}

function OrderRowDetails(props) {
    const { modelData, orders } = React.useContext(PageContext)

    const [address, setAddress] = React.useState(props.order.address)
    const [shippingType, setShippingType] = React.useState("NONE")

    React.useEffect(() => {
        if (props.modelData.codeBinaB2CItemNumber === props.order.shipping.code)
            setShippingType("B2C")
        else if (props.modelData.codeBinaPointItemNumber === props.order.shipping.code)
            setShippingType("POINTS")
        else setShippingType("NONE")

    }, [orders])

    React.useEffect(() => {
        setAddress(getAddress())
    }, [orders, props.order])

    function markTitle(title) {
        if (props.modelData.codeBinaPickupItemNumber === props.order.shipping.code)
            return <div className=" my-2"><mark className="text-danger p-1 px-2 rounded shadow-sm">{title}</mark></div>
        return title
    }

    function getAddress() {
        return props.order.data_record_var.address ?? props.order.address
    }

    function getLockerData() {
        if (props.order.data_record_var.point) {
            const point = modelData.cheetah.find(i => i.lockerCode == props.order.data_record_var.point)
            if (point) {

                return {
                    city_name: point.lockerCity,
                    locker_code: point.lockerCode
                }
            }
        }

        return props.order.external_shipping_hash[props.order.external_shipping_hash.length - 1]
    }

    function handleShippingValidChange(value) {
        props.helpers.setShippingValid(value)
    }

    function handleAddressChange(value) {
        props.helpers.setShippingAddress(value)
    }

    return (
        <Card>
            <Card.Header>
                הזמנה מס' #{props.order.id}
            </Card.Header>
            <Card.Body className="p-0">
                <ListGroup>
                    <ListGroupItem>
                        <div><b>שם הלקוח:</b></div>
                        <div>{props.order.name}</div>
                    </ListGroupItem>
                    <ListGroupItem>
                        <div><b>טלפון:</b></div>
                        <div>{props.order.phone}</div>
                    </ListGroupItem>
                    {props.order.note && (
                        <ListGroupItem>
                            <b>הערות:</b><br />
                            <h5 className="m-0 my-2 "><mark className=" text-danger p-1 px-2 rounded shadow-sm"><b style={{ lineHeight: "1.5" }}>{props.order.note}</b></mark></h5>
                        </ListGroupItem>
                    )}
                    {props.order.additional_inputs?.extra_full_name && (
                        <ListGroupItem>
                            <b>שם על חשבונית:</b><br />
                            {props.order.additional_inputs.extra_full_name} (ח.פ/ת.ז: {props.order.additional_inputs.extra_identity})
                        </ListGroupItem>
                    )}
                    <ListGroupItem>
                        <div><b>סה"כ לתשלום:</b></div>
                        <div>{props.order.total_price}&nbsp;₪</div>
                    </ListGroupItem>
                    <ListGroupItem>
                        <div><b>משלוח:</b></div>
                        <div>{markTitle(props.order.shipping.title)}</div>

                        {shippingType === "B2C" && <OrderShippingB2C onValidChange={handleShippingValidChange} onAddressChange={handleAddressChange} orderToken={props.modelData.orderToken} orderId={props.order.id} address={address} />}
                        {shippingType === "POINTS" && <OrderShippingPoint onValidChange={handleShippingValidChange} onPointChange={handleAddressChange} orderToken={props.modelData.orderToken} orderId={props.order.id} lockerData={getLockerData()} />}

                    </ListGroupItem>
                </ListGroup>
            </Card.Body>
        </Card>
    )
}

function OrderShippingB2C(props) {
    const [loading, setLoading] = React.useState(false)

    const { user } = React.useContext(AuthContext)
    const { orders, setOrders, business } = React.useContext(PageContext)

    const [streetId, setStreetId] = React.useState(0)
    const [cityId, setCityId] = React.useState(0)
    const [isValid, setIsValid] = React.useState(null)

    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

    React.useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const res = await CheetahApi.setAuthHeader(user.token).validateCity(props.address.city)
                if (res.result) {
                    handleValid(true)
                    props.onAddressChange(props.address)
                }
                else handleValid(false)
            } catch (error) {
                toast.error(error.message)
            }
            setLoading(false)
        }

        load()
    }, [orders])

    function handleValid(value) {
        setIsValid(value)
        props.onValidChange(value)
    }

    async function onSubmit(data) {
        try {
            let data1 = { token: props.orderToken, ...data }
            await KonimboApi.setAuthHeader(user.token).updateOrderAddress(props.orderId, data1)

            setOrders(prev => {
                const clone = [...prev]
                const index = clone.findIndex(o => o.id === props.orderId)
                const item = { ...clone[index] }

                item.data_record_var.address = data
                return [
                    ...clone.slice(0, index),
                    item,
                    ...clone.slice(index + 1)
                ]
            })

            props.onAddressChange(data)
            handleValid(true)
            toast.success("כתובת עודכנה בהצלחה")
        } catch (error) {
            toast.error("כתובת לא עודכנה")
            toast.error(error.message)
        }
    }

    function validateStreet() {
        if (typeof streetId === "number")
            return streetId > 0

        if (!streetId)
            return false

        return true
    }

    return (
        <>
            {loading && <Loader />}
            {!loading && <>
            {isValid !== null && <>
                {isValid &&
                    <span className="mt-2 badge bg-success text-wrap" style={{ fontSize: '14px' }}>
                        {props.address.street}
                        {props.address.street_number ? ` ${props.address.street_number}` : ``}
                        {props.address.apartment ? ` דירה ${props.address.apartment}` : ``}
                        , {props.address.city}
                    </span>
                }

                {!isValid && <>
                    <div className="mt-2 badge bg-danger text-wrap" style={{ fontSize: '14px' }}>
                        <p className="m-0 mb-1"><u>כתובת לא תקינה:</u></p>
                        {props.address.street}
                        {props.address.street_number ? ` ${props.address.street_number}` : ``}
                        {props.address.apartment ? ` דירה ${props.address.apartment}` : ``}
                        , {props.address.city}
                        <hr />
                        <Form onSubmit={handleSubmit(onSubmit)} className="bg-white text-black p-2" style={{ boxShadow: "inset 0 0 3px 2px #dc3545" }}>
                            <Form.Group>
                                <Form.Label>עיר</Form.Label>
                                <AutocompleteInput
                                    {...register("city", { required: "שדה זה הינו חובה" })}
                                    url={"http://localhost:5000/api/cheetah/validate_form?businessId=" + business.id}
                                    onSelect={(item) => {
                                        if (item) {
                                            setCityId(item.id)
                                            setValue("city", item.name, { shouldValidate: true })
                                        }
                                        else {
                                            setCityId(0)
                                            setValue("city", null, { shouldValidate: true })
                                        }
                                    }}
                                />
                                {errors.city && <p className="text-danger">{errors.city.message}</p>}
                            </Form.Group>
                            {cityId > 0 &&
                                <Form.Group>
                                    <Form.Label>רחוב</Form.Label>
                                    <AutocompleteInput
                                        {...register("street", { required: "שדה זה הינו חובה" })}
                                        url={`http://localhost:5000/api/cheetah/validate_form_street/${cityId}/${business.id}`}
                                        onSelect={(item) => {
                                            console.log(item)
                                            if (item) {
                                                setStreetId(item.id)
                                                setValue("street", item.name, { shouldValidate: true })
                                            }
                                            else {
                                                setStreetId(0)
                                                setValue("street", null, { shouldValidate: true })
                                            }
                                        }}
                                    />
                                    {errors.street && <p className="text-danger">{errors.street.message}</p>}
                                </Form.Group>
                            }
                            {validateStreet() && <>
                                <Form.Group>
                                    <Form.Label>בניין</Form.Label>
                                    <Form.Control
                                        type="number"
                                        {...register("street_number", {
                                            required: "שדה זה הינו חובה",
                                            valueAsNumber: true
                                        })}
                                    />
                                    {errors.street_number && <p className="text-danger">{errors.street_number.message}</p>}
                                </Form.Group>
                                <Form.Group>
                                    <Form.Label>דירה</Form.Label>
                                    <Form.Control
                                        type="number"
                                        {...register("apartment", {
                                            valueAsNumber: true
                                        })}
                                    />
                                </Form.Group>
                            </>}

                            <div className="mt-2">
                                <Button type="submit">אישור</Button>
                            </div>
                        </Form>

                    </div>
                </>}
            </>}
            </>}
        </>
    )

}

function OrderShippingPoint(props) {
    const [loading, setLoading] = React.useState(false)

    const { user } = React.useContext(AuthContext)
    const { modelData, orders, setOrders } = React.useContext(PageContext)
    const [isValid, setIsValid] = React.useState(null)


    const [matchingOptions, setMatchingOptions] = React.useState([]);

    const [sortedPointsData, setSortedPointsData] = React.useState([]);

    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

    React.useEffect(() => {
      setLoading(true)
        if (props.lockerData) {
            const points = modelData.cheetah.filter((info) => info.lockerCity === props.lockerData.city_name)
            setMatchingOptions(points)

            setSortedPointsData(points.length ? ([
                ...points.sort((a, b) => a.name.localeCompare(b.name)),
                ...modelData.cheetah.filter((info) => !points.includes(info))
            ]) : (modelData.cheetah))

            const point = modelData.cheetah.find(i => i.lockerCode == props.lockerData.locker_code)
            if (point) {
                handleValid(true)
                props.onPointChange({ cityName: props.lockerData.city_name, point: Number(props.lockerData.locker_code), name: point.lockerText })
            }
            else handleValid(false)
        }
        else handleValid(false)

        setLoading(false)
    }, [props.lockerData])

    function handleValid(value) {
        setIsValid(value)
        props.onValidChange(value)
    }

    async function onSubmit(data) {
        try {
            let data1 = { token: props.orderToken, point: data.point }
            await KonimboApi.setAuthHeader(user.token).updateOrderPoint(props.orderId, data1)

            setOrders(prev => {
                const clone = [...prev]
                const index = clone.findIndex(o => o.id === props.orderId)
                const item = { ...clone[index] }

                item.data_record_var.point = data.point
                return [
                    ...clone.slice(0, index),
                    item,
                    ...clone.slice(index + 1)
                ]
            })

            //props.onPointChange(data.point)
            props.onPointChange({ cityName: data.cityName, point: data.point, name: data.name })

            handleValid(true)
            toast.success("נקודה עודכנה בהצלחה")
        } catch (error) {
            toast.error("נקודה לא עודכנה")
            toast.error(error.message)
        }
    }

    return (
        <>
            {loading && <Loader />}
            {!loading && <>
            {isValid !== null && <>
                {isValid &&
                    <span className="mt-2 badge bg-success text-wrap" style={{ fontSize: '14px' }}>
                        {modelData.cheetah.find(i => i.lockerCode == props.lockerData.locker_code)?.lockerText}
                    </span>
                }

                {!isValid && <>
                    <div className="mt-2 badge bg-danger text-wrap" style={{ fontSize: '14px' }}>
                        {!props.lockerData && <p>
                            הלקוח לא בחר נקודת חלוקה
                        </p>}

                        {props.lockerData && <p>
                            נקודת החלוקה שהלקוח בחר ביישוב <u>"{props.lockerData.city_name}"</u> לא פעילה.
                        </p>}

                        <hr />
                        <Form onSubmit={handleSubmit(onSubmit)} className="bg-white text-black p-2" style={{ boxShadow: "inset 0 0 3px 2px #dc3545" }}>
                            <Form.Group>
                                <Form.Label>נקודת חלוקה</Form.Label>
                                <AutocompleteInput
                                    {...register("point", { required: "שדה זה הינו חובה" })}
                                    suggestions={sortedPointsData}
                                    onSelect={(item) => {
                                        if (item) {
                                            setValue("point", item.id, { shouldValidate: true })
                                            setValue("cityName", item.lockerCity, { shouldValidate: true })
                                        }
                                        else {
                                            setValue("point", null, { shouldValidate: true })
                                            setValue("cityName", null, { shouldValidate: true })
                                        }
                                    }}
                                />
                                {errors.point && <p className="text-danger">{errors.point.message}</p>}
                            </Form.Group>

                            <div className="mt-2">
                                <Button type="submit">אישור</Button>
                            </div>
                        </Form>

                    </div>
                </>}
            </>}</>}
        </>
    )
}

function OrderItems(props) {
    return (
        <>
            <Card>
                <Card.Header className="text-center">
                    <b>סה"כ פריטים בהזמנה: {props.items.length - 1}</b>
                </Card.Header>
                <Card.Body>
                    <ListGroup >
                        {props.items.filter(i => i.type != "shipping").map((i, key) => <OrderItem key={key} helpers={props.helpers} data={i} />)}
                    </ListGroup>
                </Card.Body>
            </Card>
        </>
    )
}

function OrderItem(props) {
    const { modelData, business, orders } = React.useContext(PageContext)
    const [iframeLoaded, setIframeLoaded] = React.useState(false)

    const [showInventory, setShowInventory] = React.useState(false)

    const [isRowValid, setIsRowValid] = React.useState(false)
    const [data, setData] = React.useState(null)
    const [modalState, setModalState] = React.useState("NONE")

    React.useEffect(() => {
        const konimboData = modelData.konimbo.find(i => i.id == props.data.item_id)
        let temp = { ...props.data, konimboData: konimboData }

        const codeBinaData = modelData.codeBina.find(i => {
            if (props.data.second_code) return i.ItemNo == props.data.second_code;
            return false
        })
        if (codeBinaData)
            temp.codeBinaData = { ...codeBinaData }

        setData(temp)
    }, [orders])

    React.useEffect(() => {

        props.helpers.setItemsData(prev => {
            let clone = [...prev]

            const index = clone.findIndex(i => i.line_item_id === props.data.line_item_id)
            let obj = { ...clone[index] }

            obj.isValid = isRowValid

            clone[index] = obj
            return clone
        })

    }, [isRowValid])

    function getImage() {
        return data.konimboData && data.konimboData.image != "" ? data.konimboData.image : "/noImg.jpeg"
    }

    function getKonimboData() {
        return business.models.find(m => m.name === "קונימבו").data
    }

    function getIcon(w) {
        const amount = getAmount(w)

        if (amount < 1)
            return <FontAwesomeIcon className="text-danger me-2" icon={faTimesCircle} />

        return <FontAwesomeIcon className="text-success me-2" icon={faCircleCheck} />
    }

    function getAmount(w) {
        const a = data.codeBinaData.Stock.find(i => i.warehouseId == w.warehouseId)
        if (a) return a.amount ?? 0;

        return 0;
    }

    return (
        <ListGroupItem variant={isRowValid ? "success" : "warning"}>
            {data && <>
                <Row>
                    <Col md="2">
                        <div onClick={() => setModalState("IMG")} className="bg-white p-3 rounded-4 border shadow-sm d-flex align-items-center h-100">
                            <img className="img-fluid" src={getImage()} />
                        </div>
                    </Col>
                    <Col md="6" className="text-black">
                        <b className="text-primary">
                            <u
                                style={{ cursor: "pointer" }}
                                onClick={() => setModalState("IFRAME")}>
                                {data.title}
                            </u>
                        </b>
                        <div className="mt-2">
                            <b className="me-1">כמות:</b>
                            {parseInt(data.quantity) > 1 ? (
                                <span className="badge bg-danger shadow-sm" style={{ background: 'black', color: 'yellow', fontSize: '16px', fontWeight: 'bold' }}>
                                    {data.quantity} (שים לב לכמות!)
                                </span>
                            ) : (
                                data.quantity
                            )}
                        </div>
                        <div>
                            {!data.codeBinaData && <b className="text-danger">לא מוגדר מק"ט לפריט בקונימבו</b>}
                            {data.codeBinaData && <>
                                <div className="user-select-none">
                                    <b className="me-1">מק"ט:</b>{data.codeBinaData.ItemNo}
                                    <b className="mx-1">|</b>
                                    {data.codeBinaData.Barcode != data.codeBinaData.ItemNo ? <><b className="me-1">ברקוד:</b> {data.codeBinaData.Barcode}</> : <b className="text-danger">לא מוגדר ברקוד בקוד בינה</b>}
                                </div>
                                <div>
                                    {data.codeBinaData.WareHousePos != "" ? <><b className="me-1">מיקום במחסן:</b>{data.codeBinaData.WareHousePos}</> : <></>}
                                </div>

                                <div className="mt-1">
                                    <Button tabIndex="-1" size="sm" className="position-relative text-white"
                                        onMouseEnter={() => setShowInventory(true)}
                                        onMouseLeave={() => setShowInventory(false)}
                                    >
                                        <b>מלאי מחסנים</b>

                                        {showInventory && <div className="position-absolute text-start border shadow bg-white p-1 px-2 text-black" style={{ top: "100%", right: 0, width: "max-content", zIndex: 1 }}>
                                            {business.warehouses.map((w, key) =>
                                                <div key={key} className="d-block">
                                                    {getIcon(w)}
                                                    <span className="me-1">{w.warehouseName}</span>
                                                    (
                                                    <span dir="ltr" className="">
                                                        {getAmount(w)}
                                                    </span>
                                                    )
                                                </div>
                                            )}
                                        </div>}

                                    </Button>
                                </div>

                            </>}
                        </div>
                    </Col>
                    <Col md="3">
                        <OrderItemInputs
                            helpers={{ ...props.helpers, isRowValid, setIsRowValid, line_item_id: data.line_item_id }}
                            codes={{ barcode: data.codeBinaData?.Barcode, itemNo: data.codeBinaData?.ItemNo }}
                            quantity={data.quantity} />
                    </Col>
                </Row>

                <Modal
                    show={modalState == "IMG"}
                    onHide={() => setModalState("NONE")}
                    size="lg"
                    centered
                    aria-labelledby="contained-modal-title-vcenter">

                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            תמונת המוצר
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <img style={{ maxWidth: '500px', maxHeight: '60vh', display: 'block', margin: '0 auto' }} src={getImage()} alt="" />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" onClick={() => setModalState("NONE")}>סגירה</Button>
                    </Modal.Footer>
                </Modal>

                <Modal
                    show={modalState == "IFRAME"}
                    onHide={() => setModalState("NONE")}
                    size="xl"
                    centered
                    aria-labelledby="contained-modal-title-vcenter">

                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            מידע על המוצר
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body style={{ height: "65vh" }}>
                        {!iframeLoaded && <>
                            <div className="h-75 d-flex justify-content-center align-items-center">
                                <Spinner animation="grow" variant="info" className="me-4 shadow" />
                                <Spinner animation="grow" variant="warning" className="me-4 shadow" />
                                <Spinner animation="grow" variant="info" className=" shadow" />
                            </div>
                        </>}
                        <iframe src={getKonimboData().shopUrl + "/items/" + data.item_id}
                            width="100%"
                            style={{ display: iframeLoaded ? "block" : "none", height: '65vh' }}
                            onLoad={() => setIframeLoaded(true)}
                        >

                        </iframe>

                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" onClick={() => setModalState("NONE")}>סגירה</Button>
                    </Modal.Footer>
                </Modal>
            </>}
        </ListGroupItem>
    )
}

function OrderItemInputs(props) {
    const { orders } = React.useContext(PageContext)

    const [index, setIndex] = React.useState(0)
    const [data, setData] = React.useState(null)

    const barcodeRef = React.useRef(null);
    const serialNumberRefs = React.useRef([]);

    React.useEffect(() => {
        const index = props.helpers.itemsData.findIndex(i => i.line_item_id == props.helpers.line_item_id)
        setIndex(index)

        let data = props.helpers.itemsData[index]
        serialNumberRefs.current = data.serialNumbers?.map(
            (_, idx) => serialNumberRefs.current[idx] || React.createRef()
        );

        setData(data)
    }, [orders])

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (index > serialNumberRefs.current.length - 1) index = serialNumberRefs.current.length - 1
            const nextRef = serialNumberRefs.current[index]

            nextRef.current.focus();
        }
    };

    function handleBarcodeChange(value) {

        if (props.codes.barcode === value || props.codes.itemNo === value)
            props.helpers.setIsRowValid(true)
        else if (props.helpers.isRowValid) props.helpers.setIsRowValid(false)

        props.helpers.setItemsData(prev => {
            let clone = [...prev]

            let obj = { ...clone[index] }

            obj.barcode = value

            clone[index] = obj
            return clone
        })
    }

    function handleSerialNumberChange(pos, value) {
        props.helpers.setItemsData(prev => {
            let clone = [...prev]

            let obj = { ...clone[index] }

            obj.serialNumbers[pos] = value

            clone[index] = obj
            return clone
        })
    }


    return (
        <>
            {data &&
                <Form>
                    <Form.Group controlId="barcode">
                        <Form.Control
                            ref={barcodeRef}
                            placeholder="ברקוד לאימות"
                            onKeyDown={(e) => handleKeyDown(e, 0)}
                            onInput={(e) => handleBarcodeChange(e.target.value)} />
                    </Form.Group>
                    {data.serialNumbers?.map((item, index) => (
                        <Form.Group key={index} controlId={`serialNumber-${index}`}>
                            <Form.Control
                                ref={serialNumberRefs.current[index]}
                                value={item}
                                placeholder="מספר סידורי"
                                onKeyDown={(e) => handleKeyDown(e, index + 1)}
                                onInput={(e) => handleSerialNumberChange(index, e.target.value)}
                            />
                        </Form.Group>
                    ))}
                </Form>
            }
        </>
    )
}

function LikotDontWork(props) {
    const [selectedValue, setSelectedValue] = React.useState("")
    const [freeText, setFreeText] = React.useState("")

    function handleSubmit(e) {
        e.preventDefault()
        if (!selectedValue || (selectedValue === "אחר" && !freeText)) return
        const value = selectedValue === "אחר" ? freeText : selectedValue

        if (props.onSubmit)
            props.onSubmit(value)
    }

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group controlId="cancelReasons">
                <Form.Label>סיבת ביטול</Form.Label>
                <Form.Control as="select" className="mb-2" value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)}>
                    {!selectedValue && <option value={"בחר"}>בחר</option>}
                    {props.list.map((reson, key) => <option key={key} value={reson}>{reson}</option>)}
                    <option value={"אחר"}>אחר</option>
                </Form.Control>
            </Form.Group>

            {selectedValue === "אחר" && <>
                <Form.Group controlId="freeText">
                    <Form.Label>טקסט חופשי</Form.Label>
                    <Form.Control className="mb-2" type="text" value={freeText} onInput={(e) => setFreeText(e.target.value)} />
                </Form.Group>
            </>}

            <Button type="submit">אישור</Button>
        </Form>
    )

}
function TransferOrder(props) {
    const [selectedValue, setSelectedValue] = React.useState("")

    function handleSubmit(e) {
        e.preventDefault()
        if (!selectedValue) return

        if (props.onSubmit)
            props.onSubmit(selectedValue)
    }

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group controlId="warehouse">
                <Form.Label>מחסן</Form.Label>
                <Form.Control as="select" className="mb-2" value={selectedValue} onChange={(e) => setSelectedValue(e.target.value)}>
                    {!selectedValue && <option value={"בחר"}>בחר</option>}
                    {props.list.map((w, key) => <option key={key} value={w.orderStatus}>{w.warehouseName}</option>)}
                </Form.Control>
            </Form.Group>

            <Button type="submit">אישור</Button>
        </Form>
    )
}
function OrderAdminLog(props) {
    const [show, setShow] = React.useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    function removeHtmlTags(input) {
        return input.replace(/(<([^>]+)>)/gi, "");
    }

    function renderKonimboDate(date) {
        return new Date(date).toLocaleString('en-GB', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: 'numeric'
        });
    }

    return (
        <div className="table-responsive" style={{ maxHeight: "80vh", overflow: "auto" }}>
            <table className="table table-striped table-hover text-center">
                <thead style={{ fontWeight: 'bold' }}>
                    <tr>
                        <td>שעה ותאריך</td>
                        <td style={{ maxWidth: '400px' }}>תיעוד</td>
                        <td>משתמש</td>
                        <td>סטטוס</td>
                    </tr>
                </thead>
                <tbody>
                    {props.info.statuses.reverse().map((status, key) => (
                        <tr key={key}>
                            <td>{renderKonimboDate(status.updated_at)}</td>
                            <td style={{ maxWidth: '400px' }}>{removeHtmlTags(status.comment)}</td>
                            <td>{status.username}</td>
                            <td>{status.status_option_title}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TopBar(props) {

    const [selectedWarehouse, setSelectedWarehouse] = React.useState(0)
    const [pickup, setPickup] = React.useState(false)

    React.useEffect(() => {
        if (selectedWarehouse === 0 && props.warehouses && props.warehouses.length > 0) {
            setSelectedWarehouse(props.warehouses[0].warehouseId)
        }
    }, [props.warehouses])

    function pickupColor() {
        return pickup ? "primary" : "warning"
    }

    function pickupText() {
        return pickup ? "חזור להזמנות" : "איסופים עצמיים"
    }

    function handleSelect(e) {
        const val = Number(e.target.value)
        setSelectedWarehouse(val)
        props.onChange(val, pickup)
    }

    function handlePickupClick() {
        setPickup(!pickup)
        props.onChange(selectedWarehouse, !pickup)
    }

    return (
        <Alert variant="info p-2 px-4">

            <Row className="d-flex align-items-center">
                <Col>
                    <Form.Group controlId="warehouse" className="d-flex align-items-center justify-content-center justify-content-md-start">
                        <Form.Label className="m-0">החלף מחסן:</Form.Label>
                        <Form.Control className="w-50 m-2"
                            as="select"
                            value={selectedWarehouse}
                            onChange={handleSelect}
                        >
                            {props.warehouses.map((w, key) => <option key={key} value={w.warehouseId}>{w.warehouseName}</option>)}
                        </Form.Control>
                    </Form.Group>
                </Col>
                <Col md="2">
                    <ButtonGroup className="d-flex justify-content-end">
                        {selectedWarehouse !== -1 && <Button variant={pickupColor()} onClick={handlePickupClick}>{pickupText()}</Button>}
                        <Button onClick={() => props.onChange(selectedWarehouse, pickup)}>רענן</Button>
                    </ButtonGroup>
                </Col>
            </Row>

        </Alert>
    )
}

export default Konimbo