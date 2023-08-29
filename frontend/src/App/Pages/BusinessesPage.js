import React,{ useState, useEffect, useContext } from "react"
import { toast } from "react-toastify"
import { useForm } from 'react-hook-form';
import { useTable, usePagination, useSortBy, useFilters } from 'react-table';
import { ButtonGroup, Button, Modal,Form,Row,Col } from "react-bootstrap";

import {Business as BusinessApi} from "../Core/Api/MelaketApi"

export default function BusinessesPage(){
    const [businesses, setBusinesses] = useState([])
    const [selectedBusiness, setSelectedBusiness] = useState(null)

    const [addModalShow, setAddModalShow] = useState(false)
    const [editModalShow, setEditModalShow] = useState(false)
    const [deleteModalShow, setDeleteModalShow] = useState(false)
    
    useEffect(() => {
        const loadData = async ()=>{
            try {
                const data = await BusinessApi.getAsync();
                setBusinesses(data);
            } catch (error) {
                toast.error(error.message)
            }
        }
        loadData()
    }, [])

    async function handleAdd(data){
        try {
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
                updatedBusiness[index] = data; // Replace the old user data with the updated data
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
            <BusinessesTable businesses={businesses} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal} >
                <Button onClick={() => setAddModalShow(true)} size="sm">הוספת עסק</Button>
            </BusinessesTable>

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
                    <BusinessForm onSubmit={handleAdd} />
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
                            עריכת משתמש
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <BusinessForm business={selectedBusiness} onSubmit={handleUpdate} />
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
        </>
    )
}


function BusinessForm(props) {
    const [business, setBusiness] = useState(props.business ?? { email: "", name: "",codeBinaHost:"",codeBinaUser:"", codeBinaPassword:"",customerNoInBina:"" });

    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

    const onSubmit = data => {
        if (!props.onSubmit) return
        if(!data.id && data.id !== 0)
            data.id = 0
        props.onSubmit(data);
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
                            {...register("name", { required: "שדה זה הינו חובה." })}
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
                                }
                            })}
                        />
                        {errors.email && <p className="text-danger">{errors.email.message}</p>}
                    </Form.Group>
                </Col>


                <Col md="6 mb-2">
                    {/* Name Input */}
                    <Form.Group controlId="codeBinaHost">
                        <Form.Label>מארח קוד בינה</Form.Label>
                        <Form.Control
                            type="text"
                            defaultValue={business.codeBinaHost}
                            {...register("codeBinaHost", { required: "שדה זה הינו חובה.",
                                pattern: {
                                    value: /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(\#[-a-z\d_]*)?$/i,
                                    message: "כתובת לא חוקית"
                                }
                            })}
                        />
                        {errors.codeBinaHost && <p className="text-danger">{errors.codeBinaHost.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6 mb-2">
                    {/* Name Input */}
                    <Form.Group controlId="codeBinaUser">
                        <Form.Label>משתמש קוד בינה</Form.Label>
                        <Form.Control
                            type="text"
                            defaultValue={business.codeBinaUser}
                            {...register("codeBinaUser", { required: "שדה זה הינו חובה." })}
                        />
                        {errors.codeBinaUser && <p className="text-danger">{errors.codeBinaUser.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6 mb-2">
                        <Form.Group controlId="codeBinaPassword">
                            <Form.Label>סיסמא קוד בינה</Form.Label>
                            <Form.Control
                                type="password"
                                defaultValue={business.codeBinaPassword}
                                {...register("codeBinaPassword", { required: "שדה זה הינו חובה." })}
                            />
                            {errors.codeBinaPassword && <p className="text-danger">{errors.codeBinaPassword.message}</p>}
                        </Form.Group>
                </Col>
                <Col md="6 mb-2">
                    {/* Name Input */}
                    <Form.Group controlId="customerNoInBina">
                        <Form.Label>מזהה לקוח קוד בינה</Form.Label>
                        <Form.Control
                            type="text"
                            defaultValue={business.customerNoInBina}
                            {...register("customerNoInBina", { required: "שדה זה הינו חובה." })}
                        />
                        {errors.customerNoInBina && <p className="text-danger">{errors.customerNoInBina.message}</p>}
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
        const reversedUsers = [...props.businesses].reverse();
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