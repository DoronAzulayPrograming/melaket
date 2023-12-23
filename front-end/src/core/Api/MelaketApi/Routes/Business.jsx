import Route from "../../Route"

export default class BusinessRoute {
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

    async getCurrent() {
        return this.#base.getAsync(`${this.route}/current`);
    }

    async getAsync() {
        return this.#base.getAsync(this.route);
    }
    
    async postAsync(data) {
        const response = await this.#base.postAsync(`${this.route}`, data);
        return response.json();
    }

    async putAsync(data) {
        await this.#base.putAsync(`${this.route}/${data.id}`, data);
    }

    async deleteAsync(id) {
        await this.#base.deleteAsync(`${this.route}/${id}`);
    }
}