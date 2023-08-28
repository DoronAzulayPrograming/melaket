import React,{useContext} from 'react';
import { Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

import { AuthContext } from '../AuthProvider';
import { secureLocalStorage } from '../SecureStorage'

function LoginPage() {
    const {isLoggedIn ,setIsLoggedIn, roles, setRoles } = useContext(AuthContext);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        const response = await fetch("http://localhost:5000/api/accounts/login",{
            method:"POST",
            headers: {
              'Content-Type': 'application/json; charset=utf-8'
            },
            body:JSON.stringify(data)
        })

        if(!response.ok){
            toast.error('התחברות נכשלה - שגיאה:' + (await response.text()))
            return
        }

        const ures = await response.json()
        secureLocalStorage.setItem('u', ures)
        setIsLoggedIn(true)
        setRoles(ures.roles)
    }

    if (isLoggedIn) {
        return <Navigate to="/" />;
    }

    return (
        <div className='d-flex justify-content-center'>
            <div className='col-md-6'>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div>
                        <label htmlFor="email">אימייל</label>
                        <input className='form-control' id="email" 
                        {...register('email', { required: true })}
                        />
                        {errors.email && <p className="text-danger">שדה זה הינו חובה</p>}
                    </div>
                    <div>
                        <label htmlFor="password">סיסמא</label>
                        <input className='form-control' id="password" type="password" 
                        {...register('password', { required: true })}
                        />
                        {errors.password && <p className="text-danger m-0">שדה זה הינו חובה</p>}
                    </div>
                    <input type="submit" value="התחברות" className='btn btn-success mt-2' />
                </form>
            </div>
        </div>
    )
}
  
export default LoginPage;