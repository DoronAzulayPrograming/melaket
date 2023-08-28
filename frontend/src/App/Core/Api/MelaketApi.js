import UsersRoute from "./MelaketApi/Routes/Users"

const usersRoute = new UsersRoute("http://localhost:5000/api/accounts")

export default {
    Users:usersRoute
}

export const Users = usersRoute;

