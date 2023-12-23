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

    async validateCity(city) {
        return this.#base.getAsync(`${this.route}/validate/${city}`);
    }

    async createShipment(businessId, data) {
        return this.#base.postAsync(`${this.route}/create-shipment/${businessId}`, data, true);
    }
}