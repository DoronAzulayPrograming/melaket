import React from "react"
import { useForm } from 'react-hook-form'
import { toast } from "react-toastify"
import { useTable, usePagination, useSortBy, useFilters } from 'react-table';

import { UsersApi, BusinessApi, CodeBinaBusinessProfilesApi, WarehousesApi, UsersWarehousesApi } from "../core/Api/MelaketApi"
import { AuthContext, AuthorizeView, Authorized, NotAuthorized } from "../core/AuthProvider"
import { Form, Button, Card, Col, Row, ButtonGroup, Modal, ListGroup, ListGroupItem } from "react-bootstrap"
import { Navigate, useLocation } from "react-router-dom";
import Loader from "../components/Loader";

const SettingsPage = () => {
    const [loading, setLoading] = React.useState(false)

    const { user, login } = React.useContext(AuthContext)
    const [editCodeBina, setEditCodeBina] = React.useState(false)
    const [business, setBusiness] = React.useState(null)
    const [selected, setSelected] = React.useState(null)

    React.useEffect(() => {
        const load = async () => {
            setLoading(true)
            try {
                const b = await BusinessApi.setAuthHeader(user.token).getCurrent()
                setBusiness(b)
            } catch (error) {
                toast.error(error)
            }
            setLoading(false)
        }
        load()
    }, [])

    async function handleCodeBinaSubmit(data) {
        if (data.businessId > 0) {
            try {
                await CodeBinaBusinessProfilesApi.setAuthHeader(user.token).putAsync(data)
            } catch (error) {
                toast.error("שגיאה בעדכון נתוני קוד בינה: " + error.message)
                return
            }
        } else {
            try {
                data.businessId = business.id
                data = await CodeBinaBusinessProfilesApi.setAuthHeader(user.token).postAsync(data)
            } catch (error) {
                toast.error("שגיאה בעדכון נתוני קוד בינה: " + error.message)
                return
            }
        }
        setBusiness({ ...business, codeBina: data })
        setEditCodeBina(false)
        toast.success("נתוני קוד בינה עודכנו בהצלחה")
    }
    async function handleSubmitWarehouse(data) {
        data = { businessId: business.id, ...data }

        try {
            const res = await WarehousesApi.setAuthHeader(user.token).postAsync(data)

            setBusiness(prevBusiness => {
                const clone = { ...prevBusiness }
                const warehouses_clone = [...clone.warehouses]
                warehouses_clone.push(res)
                clone.warehouses = warehouses_clone
                return clone
            })

            toast.success("מחסן נוסף בהצלחה.")
        } catch (error) {
            toast.error(error)
        }

    }
    async function handleDeleteWarehouse(id) {
        try {
            await WarehousesApi.setAuthHeader(user.token).deleteAsync(id)
            setBusiness(prev => {
                const clone = { ...prev }
                const clone_warehouses = [...clone.warehouses]
                clone.warehouses = clone_warehouses.filter(w => w.id !== id)

                let clone_users = [...clone.users]
                clone_users.forEach(u => {
                    u.warehouses = u.warehouses.filter(w => w.id !== id)
                })

                clone.users = clone_users
                return clone
            })

            toast.success("מחסן נמחק בהצלחה.")
        } catch (error) {
            toast.error(error)
        }
    }

    async function handleUpdateWarehouse(data) {
        data = {
            id: data.id,
            businessId: business.id,
            ...data
        }

        try {
            await WarehousesApi.setAuthHeader(user.token).putAsync(data)

            setBusiness(prev => {
                const clone = { ...prev }
                let clone_warehouses = [...clone.warehouses]

                const index = clone_warehouses.findIndex(i => i.id === data.id)
                clone_warehouses[index] = data

                let clone_users = [...clone.users]
                clone_users.forEach(u => {
                    let i = u.warehouses.findIndex(w => w.id === data.id)
                    if (i > -1) {
                        u.warehouses[i] = data
                    }
                })

                clone.users = clone_users
                clone.warehouses = clone_warehouses

                return clone
            })

            toast.success("מחסן עודכן בהצלחה.")
        } catch (error) {
            toast.error(error)
        }

    }

    async function handleUserUpdate(data) {
        try {
            await UsersApi.setAuthHeader(user.token).putAsync(data)

            if (data.password)
                delete data.password

            if(user.id === data.id)
                login({ ...user, ...data })

            setBusiness(prev => {
                const clone = { ...prev }
                let users = [...clone.users]

                const userIndex = users.findIndex(u => u.id === data.id)
                users[userIndex] = { ...users[userIndex], ...data }

                clone.users = users
                return clone
            })

            toast.success("משתמש עודכן בהצלחה.")
        } catch (error) {
            toast.error(error)
        }
    }

    async function handleRolesChange(oldUser, role, value) {
        const updatedBusiness = JSON.parse(JSON.stringify(business));

        const index = updatedBusiness.users.findIndex(u => u.id === oldUser.id);
        const updatedUser = updatedBusiness.users[index]

        if (oldUser.id === user.id) {
            toast.warning("אין אפשרות לשנות הרשאות למשתמש הנוכחי")
            return
        }

        if (value) {
            if (!updatedUser.roles.includes(role)) {
                updatedUser.roles.push(role);
            }
        } else {
            if (updatedUser.roles.length - 1 < 1) {
                toast.warning("לפחות הרשאה 1")
                return updatedBusiness
            }
            updatedUser.roles = updatedUser.roles.filter(r => r !== role);
        }

        let data = {
            id: updatedBusiness.users[index].id,
            roles: updatedBusiness.users[index].roles
        }

        try {
            await UsersApi.setAuthHeader(user.token).putAsync(data)
            setBusiness(updatedBusiness);
        } catch (error) {
            toast.error("שגיאה בעדכון נתוני קוד בינה: " + error.message)
            return
        }
    }
    async function handleAddWarehouseToUser(data) {
        try {
            const model = {
                userId: selected.id,
                warehouseId: data.id
            }

            await UsersWarehousesApi.postAsync(model)

            setBusiness(prevBusiness => {
                const clone = { ...prevBusiness }
                const userIndex = clone.users.findIndex(i => i.id === selected.id)

                if (userIndex < 0) {
                    toast.error("שגיאה בהוספת מחסן.")
                    return prevBusiness;  // Return previous state in case of error
                }

                // Instead of push, use spread to create a new warehouses array
                const updatedWarehouses = [...clone.users[userIndex].warehouses, data];

                const updatedUser = {
                    ...clone.users[userIndex],
                    warehouses: updatedWarehouses
                };

                clone.users = [
                    ...clone.users.slice(0, userIndex),
                    updatedUser,
                    ...clone.users.slice(userIndex + 1)
                ];

                return clone;
            })


            setSelected(prevSelected => {
                const clone = { ...prevSelected }
                clone.warehouses.push(data)

                return clone
            })

            toast.success("מחסן נוסף בהצלחה.")
        } catch (error) {
            toast.error(error.message || error);
        }
    }
    async function handleDeleteWarehouseFromUser(data) {
        try {
            const model = {
                userId: selected.id,
                warehouseId: data.id
            }

            await UsersWarehousesApi.deleteAsync(model.userId, model.warehouseId);

            setBusiness(prevBusiness => {
                const clone = { ...prevBusiness };
                const userIndex = clone.users.findIndex(i => i.id === selected.id);

                if (userIndex < 0) {
                    toast.error("שגיאה במחיקת מחסן.");
                    return prevBusiness;
                }

                const updatedUser = {
                    ...clone.users[userIndex],
                    warehouses: clone.users[userIndex].warehouses.filter(w => w.id !== data.id)
                };

                clone.users = [
                    ...clone.users.slice(0, userIndex),
                    updatedUser,
                    ...clone.users.slice(userIndex + 1)
                ];

                return clone;
            });

            setSelected(prevSelected => {
                const clone = { ...prevSelected }
                clone.warehouses = clone.warehouses.filter(w => w.id !== data.id)

                return clone
            })

            toast.success("מחסן נמחק בהצלחה.");
        } catch (error) {
            toast.error(error);
        }
    }


    return (
        <AuthorizeView roles={["subAdmin", "manager"]}>
            <Authorized>
                {loading && <Loader />}
                {!loading && business && <>
                    <div>
                        <Row>
                            <Col md="6">
                                <Card className="mb-3 shadow-sm">
                                    <Card.Header>
                                        <Col className="d-flex justify-content-between">
                                            <h4>קוד בינה</h4>
                                            <Button variant={editCodeBina ? "warning" : "info"} onClick={() => setEditCodeBina(!editCodeBina)}>
                                                {editCodeBina ? "ביטול" : "עריכה"}
                                            </Button>
                                        </Col>
                                    </Card.Header>
                                    <Card.Body>
                                        <CodeBinaForm isEdit={editCodeBina} model={business.codeBina} onSubmit={handleCodeBinaSubmit} />
                                    </Card.Body>
                                </Card>
                            </Col>
                            <Col md="6">
                                <Card className="mb-3 shadow-sm">
                                    <Card.Header>
                                        <Col className="d-flex justify-content-between">
                                            <h4>מחסנים</h4>
                                        </Col>
                                    </Card.Header>
                                    <Card.Body>
                                        <Warehouses list={business.warehouses} onSubmit={handleSubmitWarehouse} onDelete={handleDeleteWarehouse} onEdit={handleUpdateWarehouse} />
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                        <Col>
                            <Card className="shadow-sm">
                                <Card.Header>
                                    <h4>משתמשים</h4>
                                </Card.Header>
                                <Card.Body>
                                    <UsersTable users={business.users} onEdit={(data) => setSelected(data)} onRolesChange={handleRolesChange} />
                                </Card.Body>
                            </Card>
                        </Col>
                    </div>

                    {selected &&
                        <Modal
                            show={selected !== null}
                            onHide={() => setSelected(null)}

                            size="lg"
                            aria-labelledby="contained-modal-title-vcenter"
                            centered
                        >
                            <Modal.Header closeButton>
                                <Modal.Title id="contained-modal-title-vcenter">
                                    עריכה
                                </Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <Row>
                                    <Col md className="mb-3">
                                        <Card>
                                            <Card.Header>
                                                <h5>פרטי משתמש</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <UserEditForm modal={selected} onSubmit={handleUserUpdate} />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                    <Col md className="mb-3">
                                        <Card>
                                            <Card.Header>
                                                <h5>מחסנים</h5>
                                            </Card.Header>
                                            <Card.Body>
                                                <UserWarehouses user={selected} onAdd={handleAddWarehouseToUser} onDelete={handleDeleteWarehouseFromUser} />
                                            </Card.Body>
                                        </Card>
                                    </Col>
                                </Row>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={() => setSelected(null)}>סגירה</Button>
                            </Modal.Footer>
                        </Modal>}
                </>}
            </Authorized>
            <NotAuthorized>
                <Navigate to={"/login?rt=" + useLocation().pathname + "&msg=איזור מוגן למנהלים"} />
            </NotAuthorized>
        </AuthorizeView>
    )
}

function CodeBinaForm(props) {
    const [codeBina, setCodeBina] = React.useState(props.model ?? { host: "", user: "", password: "", customerNo: 0 });

    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

    React.useEffect(() => {
        setCodeBina(props.model ?? { host: "", user: "", password: "", customerNo: 0 })
    }, [props.model])


    const onSubmit = data => {
        if (!props.onSubmit) return
        if (props.model)
            data.businessId = props.model.businessId

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
                            disabled={!props.isEdit}
                            defaultValue={codeBina.host}
                            {...(props.isEdit ? register("host", {
                                required: "שדה זה הינו חובה.",
                                pattern: {
                                    value: /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i,
                                    message: "כתובת לא חוקית"
                                }
                            }
                            ) : {})}
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
                            disabled={!props.isEdit}
                            defaultValue={codeBina.user}
                            {...(props.isEdit ? register("user", {
                                required: "שדה זה הינו חובה.",
                                maxLength: {
                                    value: 64,
                                    message: "ערך מקסימלי של 64 תווים"
                                }
                            }
                            ) : {})}
                        />
                        {errors.user && <p className="text-danger">{errors.user.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6 mb-2">
                    <Form.Group controlId="password">
                        <Form.Label>סיסמא קוד בינה</Form.Label>
                        <Form.Control
                            type="password"
                            disabled={!props.isEdit}
                            defaultValue={codeBina.password}
                            {...(props.isEdit ? register("password", {
                                required: "שדה זה הינו חובה.",
                                maxLength: {
                                    value: 64,
                                    message: "ערך מקסימלי של 64 תווים"
                                }
                            }
                            ) : {})}
                        />
                        {errors.password && <p className="text-danger">{errors.password.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6 mb-2">
                    {/* Name Input */}
                    <Form.Group controlId="customerNo">
                        <Form.Label>מזהה לקוח קוד בינה</Form.Label>
                        <Form.Control
                            style={{ direction: "rtl" }}
                            type="number"
                            disabled={!props.isEdit}
                            defaultValue={codeBina.customerNo}
                            {...(props.isEdit ? register("customerNo", {
                                valueAsNumber: true,
                                required: "שדה זה הינו חובה.",
                                min: {
                                    value: 1,
                                    message: "הערך המינימלי הוא 1"
                                }
                            }
                            ) : {})}
                        />
                        {errors.customerNo && <p className="text-danger">{errors.customerNo.message}</p>}
                    </Form.Group>
                </Col>


                {props.isEdit && <Col md="12 pt-2">
                    <Button variant="primary" type="submit">
                        אישור
                    </Button>
                </Col>}
            </Row>
        </Form>
    );
}

function Warehouses(props) {
    const [activeModal, setActiveModal] = React.useState(null)
    const [selected, setSelected] = React.useState(null)

    const warehouses = React.useMemo(() => {
        const reversedUsers = [...props.list].reverse();
        return reversedUsers.map((item, index) => {
            return {
                ...item,
                index: index + 1 // Reversing the index directly
            };
        });
    }, [props.list]);


    function handleOpenEditModel(data) {
        setSelected(data)
        setActiveModal("EDIT")
    }

    function handleOpenDeleteModel(data) {
        setSelected(data)
        setActiveModal("DELETE")
    }
    function handleDelete() {
        props.onDelete(selected.id)
        handleCloseModal()
    }

    function handleCloseModal() {
        setSelected(null)
        setActiveModal(null)
    }

    return (
        <>
            <WarehousesTable data={warehouses} onDelete={handleOpenDeleteModel} onEdit={handleOpenEditModel}>
                <Button size="sm" onClick={() => setActiveModal("ADD")}>הוספת מחסן</Button>
            </WarehousesTable>

            <Modal
                show={activeModal === "EDIT"}
                onHide={handleCloseModal}

                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        עריכה
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <WarehouseForm data={selected} onSubmit={(data) => { props.onEdit(data); handleCloseModal() }} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>סגירה</Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={activeModal === "DELETE"}
                onHide={handleCloseModal}

                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton className="text-white bg-danger">
                    <Modal.Title id="contained-modal-title-vcenter">
                        מחיקה
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    בטוח שברצונך למחוק מחסן <b>{selected?.warehouseName}</b> ?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="danger" onClick={handleDelete}>אישור</Button>
                    <Button variant="secondary" onClick={handleCloseModal}>סגירה</Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={activeModal === "ADD"}
                onHide={handleCloseModal}

                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        הוספה
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <WarehouseForm onSubmit={(data) => { props.onSubmit(data); handleCloseModal() }} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>סגירה</Button>
                </Modal.Footer>
            </Modal>
        </>
    )
}

function WarehousesTable(props) {
    const data = React.useMemo(() => {
        const reversedUsers = [...props.data].reverse();
        return reversedUsers.map((item, index) => {
            return {
                ...item,
                index: index + 1 // Reversing the index directly
            };
        });
    }, [props.data]);

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
            { Header: "מזהה קוד בינה", accessor: "warehouseId" },
            { Header: "שם", accessor: "warehouseName" },
            {
                Header: 'פעולות',
                Cell: ({ row }) => (
                    <ButtonGroup>
                        <Button size="sm" onClick={() => props.onEdit(row.original)}>עריכה</Button>
                        <Button variant="danger" size="sm" onClick={() => props.onDelete(row.original)}>מחיקה</Button>
                    </ButtonGroup>
                ),
                disableFilters: true,
            }
        ],
        [props.data]
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
            data: data,  // <-- Using users state variable as data source
            initialState: { pageIndex: 0, pageSize: 10 },
            defaultColumn: { Filter: DefaultColumnFilter },
        },
        useFilters,
        useSortBy,
        usePagination
    );

    const [showFilters, setShowFilters] = React.useState(false)

    const handleDeleteUser = async (user) => {
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
                                        <td valign="middle" {...cell.getCellProps()}>{cell.render("Cell")}</td>
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

function WarehouseForm(props) {
    const [warehouse] = React.useState(props.data ?? { warehouseId: 0, warehouseName: "" });

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = data => {
        if (!props.onSubmit) return

        if (props.data && props.data.id)
            data = { id: props.data.id, ...data }

        props.onSubmit(data);
    };

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
                <Col md="6 mb-2">
                    {/* warehouse Name Input */}
                    <Form.Group controlId="warehouseName">
                        <Form.Label>שם</Form.Label>
                        <Form.Control
                            type="text"
                            defaultValue={warehouse.warehouseName}
                            {...register("warehouseName", { required: "שדה זה הינו חובה." })}
                        />
                        {errors.warehouseName && <p className="text-danger">{errors.warehouseName.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6 mb-2">
                    {/* warehouse Id Input */}
                    <Form.Group controlId="warehouseId">
                        <Form.Label>מזהה קוד בינה</Form.Label>
                        <Form.Control
                            style={{ direction: "rtl" }}
                            type="number"
                            defaultValue={warehouse.warehouseId}
                            {...register("warehouseId", {
                                valueAsNumber: true,
                                required: "שדה זה הינו חובה.",
                                min: {
                                    value: 1,
                                    message: "ערך מינימלי 1"
                                }
                            })}
                        />
                        {errors.warehouseId && <p className="text-danger">{errors.warehouseId.message}</p>}
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

function UserWarehouses(props) {
    const { user } = React.useContext(AuthContext)
    const [activeModal, setActiveModal] = React.useState(null)
    const [selected, setSelected] = React.useState(null)
    const [warehouses, setWarehouses] = React.useState([])

    React.useEffect(() => {
        const loadData = async () => {
            try {
                setWarehouses(await WarehousesApi.setAuthHeader(user.token).getWarehousesBusinessAsync(user.businessId))
            } catch (error) {
                toast.error(error)
            }
        }
        loadData()
    }, [])

    function handleCloseModal() {
        setSelected(null)
        setActiveModal(null)
    }


    return (<>
        <div className="mb-3">
            <Form.Control
                as="select"
                onInput={(e) => {
                    const value = e.target.value
                    if (value < 1) return
                    const warehouse = warehouses.find(w => w.id == value)
                    setSelected(warehouse)
                    setActiveModal("ADD")
                }}
            >
                {warehouses.length > -1 && <option value="">בחר</option>}
                {warehouses.length && <>
                    {warehouses.filter(i => !props.user.warehouses.find(uw => uw.id === i.id)).map((i, key) => <option key={key} value={i.id}>{i.warehouseName}</option>)}
                </>}
            </Form.Control>
        </div>
        <ListGroup>
            {props.user.warehouses.map((w, key) =>
                <ListGroupItem key={key}>
                    <div className="d-flex justify-content-between">
                        {w.warehouseName}
                        <Button onClick={() => { setSelected(w); setActiveModal("DELETE") }} size="sm" variant="danger" className="py-0">-</Button>
                    </div>
                </ListGroupItem>
            )}
        </ListGroup>

        {selected && <>
            <Modal
                show={activeModal === "DELETE"}
                onHide={handleCloseModal}

                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton className="text-white bg-danger">
                    <Modal.Title id="contained-modal-title-vcenter">
                        אזהרה
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    בטוח שברצונך למחוק מחסן <b>{selected?.warehouseName}</b> זה להמשתמש <b>{props.user.name}</b>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => { props.onDelete(selected); handleCloseModal() }}>אישור</Button>
                    <Button variant="secondary" onClick={handleCloseModal}>סגירה</Button>
                </Modal.Footer>
            </Modal>

            <Modal
                show={activeModal === "ADD"}
                onHide={handleCloseModal}

                size="lg"
                aria-labelledby="contained-modal-title-vcenter"
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title id="contained-modal-title-vcenter">
                        הוספה
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    בטוח שברצונך להוסיף מחסן <b>{selected?.warehouseName}</b> זה להמשתמש <b>{props.user.name}</b>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={() => { props.onAdd(selected); setSelected(null) }}>אישור</Button>
                    <Button variant="secondary" onClick={handleCloseModal}>סגירה</Button>
                </Modal.Footer>
            </Modal>
        </>}
    </>)
}

function UserEditForm(props) {
    const [isEditPassword, setIsEditPassword] = React.useState(false)
    const [modal, setModal] = React.useState(props.modal)

    const { register, unregister, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

    const onSubmit = (data) => {
        if (!props.onSubmit) return

        let printers = (data.invoicePrinter ?? "") + "," + (data.labelPrinter ?? "")
        printers = printers === "," ? "" : printers

        delete data.invoicePrinter
        delete data.labelPrinter

        data = { id: props.modal.id, printers: printers, ...data }
        props.onSubmit(data)
    }

    function getInvoicePrinterName() {
        if (modal.printers) {
            return modal.printers.split(",")[0]
        }
        return ""
    }

    function getLabelPrinterName() {
        if (modal.printers) {
            return modal.printers.split(",")[1]
        }
        return ""
    }

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            {/* Email Input */}
            <Form.Group controlId="email">
                <Form.Label>אימייל</Form.Label>
                <Form.Control style={{ direction: "rtl" }}
                    type="text"
                    defaultValue={modal.email}
                    {...register("email", {
                        required: "שדה זה הינו חובה.",
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
                            message: "כתובת אימייל לא תקינה"
                        }
                    })}
                />
                {errors.email && <p className="text-danger">{errors.email.message}</p>}
            </Form.Group>

            {/* Name Input */}
            <Form.Group controlId="name">
                <Form.Label>שם</Form.Label>
                <Form.Control
                    type="name"
                    defaultValue={modal.name}
                    {...register("name", { required: "שדה זה הינו חובה." })}
                />
                {errors.name && <p className="text-danger">{errors.name.message}</p>}
            </Form.Group>

            {/* Password Input */}
            <Form.Group className="mb-2" controlId="password">
                <Form.Label>סיסמא</Form.Label>
                <br></br>
                {/* Password Input */}
                {!isEditPassword &&
                    <Button onClick={() => setIsEditPassword(true)} variant="danger">שינוי סיסמא</Button>
                }
                {isEditPassword &&
                    <>
                        <Button onClick={() => { setIsEditPassword(false); unregister("password") }} variant="warning" className="mb-2">ביטול</Button>
                        <Form.Control
                            type="password"
                            {...register("password", {
                                required: "שדה זה הינו חובה.",
                                minLength: {
                                    value: 3,
                                    message: "ערך מינימלי 3"
                                }
                            })}
                        />
                    </>
                }
                {errors.password && <p className="text-danger">{errors.password.message}</p>}
            </Form.Group>


            {/* invoicePrinter Input */}
            <Form.Group className="mb-2" controlId="invoicePrinter">
                <Form.Label>מדפסת חשבוניות</Form.Label>
                <Form.Control
                    type="text"
                    defaultValue={getInvoicePrinterName()}
                    {...register("invoicePrinter")}
                />
            </Form.Group>

            {/* labelPrinter Input */}
            <Form.Group controlId="labelPrinter">
                <Form.Label>מדפסת מדבקות</Form.Label>
                <Form.Control
                    type="text"
                    defaultValue={getLabelPrinterName()}
                    {...register("labelPrinter")}
                />
            </Form.Group>
            <br></br>
            <Button type="submit">אישור</Button>
        </Form>
    )
}

function UsersTable(props) {
    const { user } = React.useContext(AuthContext)

    const users = React.useMemo(() => {
        const reversedUsers = [...props.users].reverse();
        return reversedUsers.map((user, index) => {
            return {
                ...user,
                index: index + 1 // Reversing the index directly
            };
        });
    }, [props.users]);

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
            { Header: "שם", accessor: "name" },
            { Header: "אימייל", accessor: "email" },
            {
                Header: 'הרשאות',
                Cell: ({ row }) => (
                    <div>
                        {row.original.roles.includes("subAdmin") && <b>מנהל ראשי</b>}
                        {row.original.roles.includes("manager") && row.original.id === user.id && <b>משתמש נוחכי</b>}
                        {!row.original.roles.includes("subAdmin") && row.original.id !== user.id && <>
                            <Form.Check
                                className="no-select"
                                inline
                                id={"admin-role-id-" + row.original.id}
                                label="מנהל"
                                type="checkbox"
                                checked={row.original.roles.includes("manager")}
                                onChange={e => props.onRolesChange(row.original, "manager", e.target.checked)}
                            />
                            <br></br>
                            <Form.Check
                                className="no-select"
                                inline
                                id={"member-role-id-" + row.original.id}
                                label="משתמש"
                                type="checkbox"
                                checked={row.original.roles.includes("member")}
                                onChange={e => props.onRolesChange(row.original, "member", e.target.checked)}
                            />
                        </>}
                    </div>
                ),
                disableFilters: true,
            },
            {
                Header: 'מחסנים',
                Cell: ({ row }) => (
                    <ul className="m-0 p-0" style={{ listStyle: "none" }}>
                        {row.original.warehouses.map((i, key) => <li key={key}>{i.warehouseName}</li>)}
                    </ul>
                ),
                disableFilters: true,
            },
            { Header: "תאריך יצירה", accessor: "createDate" },
            {
                Header: 'פעולות',
                Cell: ({ row }) => (
                    <Button size="sm" onClick={() => props.onEdit(row.original)}>עריכה</Button>
                ),
                disableFilters: true,
            }
        ],
        [props.users]
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

    const [showFilters, setShowFilters] = React.useState(false)

    const handleDeleteUser = async (user) => {
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
                                        <td valign="middle" {...cell.getCellProps()}>{cell.render("Cell")}</td>
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

export default SettingsPage