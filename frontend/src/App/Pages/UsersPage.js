import React, { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { toast } from "react-toastify";

import { useTable, usePagination, useSortBy, useFilters } from 'react-table';

import { secureLocalStorage } from '../SecureStorage';
import { ButtonGroup, Container, Row, Col, Form, Button, Modal } from "react-bootstrap";

import AutocompleteInput from "../Components/AutocompleteInput";

import {Users as UsersApi} from "../Core/Api/MelaketApi";

export default function UsersPage() {
    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState(null)
    const [addModalShow, setAddModalShow] = useState(false)
    const [editModalShow, setEditModalShow] = useState(false)
    const [deleteModalShow, setDeleteModalShow] = useState(false)


    useEffect(() => {
        const loadUsers = async ()=>{
            try {
                const data = await UsersApi.getAsync();
                setUsers(data);
            } catch (error) {
                toast.error(error.message)
            }
        }
        loadUsers()
    }, [])

    async function handleSubmit(data) {
        try {
            const res = await UsersApi.postAsync(data);
            setUsers([...users, res])

            setAddModalShow(false)
            toast.success("משתמש נוצר בהצלחה")
        } catch (error) {
            toast.error(`שגיאה ביצירת משתמש: ${error.message}`)
            return
        }
    }

    async function handleUpdate(user) {
        user.id = selectedUser.id
        delete user.name

        try {
            const res = await UsersApi.putAsync(user);

            // Update the local user list after successful API update
            const updatedUsers = [...users]; // Make a copy of the current users
            const index = updatedUsers.findIndex(u => u.id === user.id); // Find the index of the updated user
            if (index !== -1) {
                updatedUsers[index] = res; // Replace the old user data with the updated data
                setUsers(updatedUsers); // Update the state
            }

            setEditModalShow(false);
            setSelectedUser(null)
            toast.success("משתמש עודכן בהצלחה");

        } catch (error) {
            toast.error(`שגיאה בעדכון משתמש: ${error.message}`)
            return
        }
    }

    const handleDeleteUser = async () => {
        
        try {
            await UsersApi.deleteAsync(selectedUser.id);
                
            setUsers(prevUsers => prevUsers.filter(u => u.id !== selectedUser.id))
            setDeleteModalShow(false)
            setSelectedUser(null)
            toast.success("משתמש נמחק בהצלחה")
        } catch (error) {
            toast.error(`שגיאה במחיקת משתמש: ${error.message}`)
        }
    };


    const handleOpenEditModal = (user) => {
        setSelectedUser(user)
        setEditModalShow(true)
    }
    const handleCloseEditModal = (user) => {
        setSelectedUser(null)
        setEditModalShow(false)
    }

    const handleOpenDeleteModal = (user) => {
        setSelectedUser(user)
        setDeleteModalShow(true)
    }
    const handleCloseDeleteModal = (user) => {
        setSelectedUser(null)
        setDeleteModalShow(false)
    }

    return (
        <>
            <Container className="p-3">
                <Row className="justify-content-center">
                    <Col sm md="10" className="p-0">
                        {/* <UserForm onSubmit={handleSubmit} /> */}
                        <UsersTable users={users} onDelete={handleOpenDeleteModal} onEdit={handleOpenEditModal} >
                            <Button onClick={() => setAddModalShow(true)} size="sm">הוספת משתמש</Button>
                        </UsersTable>
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
                        הוספת משתמש
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <UserForm onSubmit={handleSubmit} />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setAddModalShow(false)}>סגירה</Button>
                </Modal.Footer>
            </Modal>

            {selectedUser &&
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
                        <UserForm user={selectedUser} onSubmit={handleUpdate} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseEditModal}>סגירה</Button>
                    </Modal.Footer>
                </Modal>}

            {selectedUser &&
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
                        בטוח שברצונך למחוק משתמש זה ? {selectedUser.email}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" onClick={handleDeleteUser}>אישור</Button>
                        <Button variant="secondary" onClick={handleCloseDeleteModal}>סגירה</Button>
                    </Modal.Footer>
                </Modal>}
        </>
    )
}

function UserForm(props) {
    const rolesArray = ["subAdmin", "member", "admin"];
    const roleDisplayNames = {
        "admin": "מנהל מערכת",
        "subAdmin": "עסק",
        "member": "עובד"
    };

    const [user, setUser] = useState(props.user ?? { businessId: 0, email: "", name: "", password: "123", roles: ["subAdmin"] });

    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

    useEffect(() => {
        setValue('roles', user.roles);
    }, [user.roles, setValue]);

    // Register the business input for react-hook-form
    const { businessId } = register("businessId", {
        required: "יש לבחור עסק.",
        min: 1
        // Add other validation logic if needed
    });

    const onSubmit = data => {
        if (!props.onSubmit) return
        if(!data.id && data.id !== 0)
            data.id = 0
        props.onSubmit(data);
    };

    const handleRoleChange = (e) => {
        const value = e.target.value;
        let updatedRoles = [...user.roles];

        if (e.target.checked) {
            updatedRoles.push(value);
        } else {
            const index = updatedRoles.indexOf(value);
            if (index > -1) {
                updatedRoles.splice(index, 1);
            }
        }

        setValue("roles", updatedRoles, { shouldValidate: true })
        setUser(prev => ({ ...prev, roles: updatedRoles }));
    };
    const validateRoles = (value) => {
        return (value && value.length > 0) || "יש לבחור לפחות הרשאה אחת.";
    };

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            <Row>
                <Col md="6 mb-2">
                    {/* Email Input */}
                    <Form.Group controlId="email">
                        <Form.Label>אימייל</Form.Label>
                        <Form.Control style={{ direction: "rtl" }}
                            type="text"
                            defaultValue={user.email}
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
                    <Form.Group controlId="name">
                        <Form.Label>שם</Form.Label>
                        <Form.Control
                            type="name"
                            defaultValue={user.name}
                            {...register("name", { required: "שדה זה הינו חובה." })}
                        />
                        {errors.name && <p className="text-danger">{errors.name.message}</p>}
                    </Form.Group>
                </Col>
                    {/* Password Input */}
                    {!props.user &&
                <Col md="6 mb-2">
                        <Form.Group controlId="password">
                            <Form.Label>סיסמא</Form.Label>
                            <Form.Control
                                type="password"
                                defaultValue={user.password}
                                {...register("password", { required: "שדה זה הינו חובה." })}
                            />
                            {errors.password && <p className="text-danger">{errors.password.message}</p>}
                        </Form.Group>
                </Col>}
                <Col md="6 mb-2">
                    <Form.Group controlId="businessId">
                        <Form.Label>עסקים</Form.Label>
                        <AutocompleteInput
                            value={user.businessId}
                            url="http://localhost:5000/api/business"
                            onSelect={(selectedItem) => {
                                if (selectedItem)
                                    setValue("businessId", selectedItem.id, { shouldValidate: true });
                                else
                                    setValue("businessId", null, { shouldValidate: true });
                            }}
                        />
                        {errors.businessId && <p className="text-danger">{errors.businessId.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="6">
                    {/* Roles Input */}
                    <Form.Group>
                        <input type="hidden" {...register('roles', { validate: validateRoles })} />

                        <Form.Label>הרשאות</Form.Label>
                        {rolesArray.map((role, index) => (
                            <div key={index}>
                                <Form.Check
                                    id={`role-${role}`}
                                    type="checkbox"
                                    label={roleDisplayNames[role]}
                                    value={role}
                                    checked={user.roles.includes(role)}
                                    onChange={handleRoleChange}
                                />
                            </div>
                        ))}
                    </Form.Group>
                    {errors.roles && <p className="text-danger">{errors.roles.message}</p>}
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

function UsersTable(props) {
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
            { Header: "מזהה", accessor: "id" },
            { Header: "שם", accessor: "name" },
            { Header: "אימייל", accessor: "email" },
            { Header: "עסק", accessor: "business.name" },
            {
                Header: 'פעולות',
                Cell: ({ row }) => (
                    <ButtonGroup>
                        <Button size="sm" onClick={() => props.onEdit(row.original)}>עריכה</Button>
                        <Button size="sm" variant="danger" onClick={() => handleDeleteUser(row.original)}>מחיקה</Button>
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
