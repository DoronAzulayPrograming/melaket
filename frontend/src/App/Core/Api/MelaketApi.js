import UsersRoute from "./MelaketApi/Routes/Users"
import BusinessRoute from "./MelaketApi/Routes/Business"

const usersRoute = new UsersRoute("http://localhost:5000/api/accounts")
const businessRoute = new BusinessRoute("http://localhost:5000/api/business")

export default {
    Users:usersRoute,
    Business:businessRoute,
}

export const Users = usersRoute;
export const Business = businessRoute;

