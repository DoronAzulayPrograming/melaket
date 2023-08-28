import Route from "../../Route"

export default class UsersRoute {
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

    async getAsync() {
        return this.#base.getAsync(this.route);
    }

    async getAsyncById(id) {
        return this.#base.getAsync(`${this.route}/${id}`);
    }

    async postAsync(data) {
        return this.#base.postAsync(`${this.route}`, data);
    }

    async putAsync(data) {
        return await this.#base.putAsync(`${this.route}/${data.id}`, data);
    }

    async deleteAsync(id) {
        await this.#base.deleteAsync(`${this.route}/${id}`);
    }
}