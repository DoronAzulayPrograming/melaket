import Route from "../../Route"

export default class UsersWarehousesRoute {
    #base
    constructor(route) {
        this.route = route
        this.#base = new Route()
        this.#base._httpClient.headers['Content-Type'] = "application/json"
    }

    setAuthHeader(key) {
        this.#base.setAuthHeader(key);
        return this;
    }

    async postAsync(data) {
        const response = await this.#base.postAsync(`${this.route}`, data);
        return response.json();
    }

    async deleteAsync(userId,warehouseId) {
        await this.#base.deleteAsync(`${this.route}/${userId}/${warehouseId}`);
    }
}