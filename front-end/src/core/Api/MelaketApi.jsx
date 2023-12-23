import UsersRoute from "./MelaketApi/Routes/Users"
import ModelsRoute from "./MelaketApi/Routes/Models"
import BusinessRoute from "./MelaketApi/Routes/Business"
import WarehousesRoute from "./MelaketApi/Routes/Warehouses"
import UsersWarehousesRoute from "./MelaketApi/Routes/UsersWarehouses"
import CodeBinaBusinessProfilesRoute from "./MelaketApi/Routes/CodeBinaBusinessProfile"

import CheetahRoute from "./MelaketApi/Routes/Cheetah"

import KonimboRoute from "./MelaketApi/Routes/Konimbo"

export const BasePath = "http://localhost:5000"

export const UsersApi = new UsersRoute(BasePath+"/api/accounts")
export const ModelsApi = new ModelsRoute(BasePath+"/api/models")
export const BusinessApi = new BusinessRoute(BasePath+"/api/business")
export const WarehousesApi = new WarehousesRoute(BasePath+"/api/warehouses")
export const UsersWarehousesApi = new UsersWarehousesRoute(BasePath+"/api/userswarehouses")
export const CodeBinaBusinessProfilesApi = new CodeBinaBusinessProfilesRoute(BasePath+"/api/codebinabusinessprofiles")

export const CheetahApi = new CheetahRoute(BasePath+"/api/cheetah")
export const KonimboApi = new KonimboRoute(BasePath+"/api/konimbo")

export default {
    UsersApi,
    ModelsApi,
    BusinessApi,
    WarehousesApi,
    UsersWarehousesApi,
    CodeBinaBusinessProfilesApi,

    CheetahApi,
    KonimboApi
}

