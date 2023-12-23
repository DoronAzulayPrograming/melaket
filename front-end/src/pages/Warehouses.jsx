import React from "react";
import { useTable, usePagination, useSortBy, useFilters } from 'react-table';
import { ButtonGroup, Container, Row, Col, Form, Button, Modal } from "react-bootstrap";
import { useForm } from 'react-hook-form';
import { toast } from "react-toastify";

import AutocompleteInput from "../components/AutocompleteInput";
import { WarehousesApi } from "../core/Api/MelaketApi";
import { AuthContext } from "../core/AuthProvider";
import Loader from "../components/Loader";

const WarehousesPage = ()=>{
    const [loading, setLoading] = React.useState(true)

    const {user} = React.useContext(AuthContext)
    const [warehouses, setWarehouses] = React.useState([])
    const [selected, setSelected] = React.useState(null)
    const [activeModalName, setActiveModalName] = React.useState("NONE")
    
    React.useEffect(() => {
        const loadData = async ()=>{
            setLoading(true)
            try {
                const data = await WarehousesApi.setAuthHeader(user.token).getFullAsync();
                setWarehouses(data);
            } catch (error) {
                toast.error(error.message)
            }
            setLoading(false)
        }
        loadData()
    }, [])


    const handleAdd = async (data) => {
        try {
            const res = await WarehousesApi.setAuthHeader(user.token).postAsync(data);
            setWarehouses([...warehouses, res]);
            handleCloseModal()
            toast.success("מחסן נוצר בהצלחה")
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleUpdate = async (data) => {
        data.businessId = selected.businessId
        try {
            await WarehousesApi.setAuthHeader(user.token).putAsync(data);

            const clonedList = [...warehouses]; // Make a copy 
            const index = clonedList.findIndex(i => i.id === data.id); // Find the index
            if (index !== -1) {
                const b = clonedList[index].business
                data.business = b
                clonedList[index] = data; // Replace the old data with the updated data
                setWarehouses(clonedList); // Update the state
            }
            handleCloseModal()
            toast.success("מחסן עודכן בהצלחה")
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleDelete = async () => {
        try {
            await WarehousesApi.setAuthHeader(user.token).deleteAsync(selected.id);
            setWarehouses(p => p.filter(i=> i.id !== selected.id));
            handleCloseModal()
            toast.success("מחסן נמחק בהצלחה")
        } catch (error) {
            toast.error(error.message)
        }
    }

    const handleOpenEditModal = (data) => {
        setSelected(data)
        setActiveModalName("EDIT")
    }

    const handleOpenDeleteModal = (data) => {
        setSelected(data)
        setActiveModalName("DELETE")
    }

    const handleCloseModal = () => {
        setSelected(null)
        setActiveModalName("NONE")
    }

    return (
        <>
        
        {loading && <Loader />}
        {!loading && <>
            <Container className="p-3">
                <Row className="justify-content-center">
                    <Col sm md="10" className="p-0">
            <WarehousesTable list={warehouses} onEdit={handleOpenEditModal} onDelete={handleOpenDeleteModal}>
                <Button onClick={() => setActiveModalName("ADD")} size="sm">הוספת מחסן</Button>
            </WarehousesTable>
                    </Col>
                </Row>
            </Container>

            <Modal
            show={activeModalName === "ADD"}
            onHide={handleCloseModal}

            size="lg"
            aria-labelledby="contained-modal-title-vcenter"
            centered
            >
                    <Modal.Header closeButton>
                        <Modal.Title id="contained-modal-title-vcenter">
                            יצירה
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <WarehouseForm data={selected} onSubmit={handleAdd} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>סגירה</Button>
                    </Modal.Footer>
            </Modal>
            
            {selected &&
                <Modal
                    show={activeModalName === "EDIT"}
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
                        <WarehouseForm data={selected} onSubmit={handleUpdate} />
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>סגירה</Button>
                    </Modal.Footer>
                </Modal>}
            
            {selected &&
                <Modal
                    show={activeModalName === "DELETE"}
                    onHide={handleCloseModal}

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
                        בטוח שברצונך למחוק מחסן <b>{selected.warehouseName}</b> מעסק <b>{selected.business.name}</b>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="danger" onClick={handleDelete}>אישור</Button>
                        <Button variant="secondary" onClick={handleCloseModal}>סגירה</Button>
                    </Modal.Footer>
                </Modal>}
            </>}
        </>
    )

}

function WarehouseForm(props) {
    const [warehouse, setWarehouse] = React.useState(props.data ?? { businessId: 0, warehouseId: 0, warehouseName: "" });

    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();

    React.useEffect(()=>{
        if(props.data)
            setValue("businessId",props.data.businessId)
    })

    // Register the business input for react-hook-form
    const { businessId } = register("businessId", {
        required: "יש לבחור עסק.",
        min: 1
        // Add other validation logic if needed
    });

    const onSubmit = data => {
        if (!props.onSubmit) return
        if(props.data && props.data.id && props.data.id !== 0)
            data.id = props.data.id
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
                    <Form.Group controlId="businessId">
                        <Form.Label>עסקים</Form.Label>
                        {props.data && 
                            <Form.Control disabled value={props.data.business.name}/>
                        }
                        {!props.data && 
                        <AutocompleteInput
                            value={warehouse.businessId}
                            url="http://localhost:5000/api/business"
                            onSelect={(selectedItem) => {
                                if (selectedItem)
                                    setValue("businessId", selectedItem.id, { shouldValidate: true });
                                else
                                    setValue("businessId", null, { shouldValidate: true });
                            }}
                        />}
                        {errors.businessId && <p className="text-danger">{errors.businessId.message}</p>}
                    </Form.Group>
                </Col>
                <Col md="4 mb-2">
                    {/* warehouse Id Input */}
                    <Form.Group controlId="warehouseId">
                        <Form.Label>מזהה קוד בינה</Form.Label>
                        <Form.Control
                            style={{direction:"rtl"}}
                            type="number"
                            defaultValue={warehouse.warehouseId}
                            {...register("warehouseId", { 
                                valueAsNumber:true,
                                required: "שדה זה הינו חובה." ,
                                min:{
                                    value:1,
                                    message:"ערך מינימלי 1"
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

function WarehousesTable(props) {
    const warehouses = React.useMemo(() => {
        const reversed = [...props.list].reverse();
        return reversed.map((user, index) => {
            return {
                ...user,
                index: index + 1 // Reversing the index directly
            };
        });
    }, [props.list]);

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
            { Header: "קוד בינה", accessor: "warehouseId" },
            { Header: "שם", accessor: "warehouseName" },
            { Header: "עסק", accessor: "business.name" },
            {
                Header: 'פעולות',
                Cell: ({ row }) => (
                    <ButtonGroup>
                        <Button size="sm" onClick={() => props.onEdit(row.original)}>עריכה</Button>
                        <Button size="sm" variant="danger" onClick={() => props.onDelete(row.original)}>מחיקה</Button>
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
            data: warehouses,  // <-- Using users state variable as data source
            initialState: { pageIndex: 0, pageSize: 10 },
            defaultColumn: { Filter: DefaultColumnFilter },
        },
        useFilters,
        useSortBy,
        usePagination
    );

    const [showFilters, setShowFilters] = React.useState(false)

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

export default WarehousesPage