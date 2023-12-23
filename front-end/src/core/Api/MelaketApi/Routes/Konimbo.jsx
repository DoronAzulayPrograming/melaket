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

    async updateOrderPoint(id,point){
        return this.#base.putAsync(`${this.route}/point/${id}`, point);
    }

    async updateOrderAddress(id,address){
        return this.#base.putAsync(`${this.route}/address/${id}`, address);
    }

    async getOrders(status) {
        return this.#base.getAsync(`${this.route}/orders/${status}`);
    }

    async debitOrder(orderId, data) {
        return this.#base.postAsync(`${this.route}/debit-order/${orderId}`, data);
    }

    async updateStatus(orderId, data) {
        return this.#base.putAsync(`${this.route}/status/${orderId}`, data);
    }

    async invoice(orderId, data) {
        return this.#base.postAsync(`${this.route}/invoice/${orderId}`, data);
    }

    async sendEmail(data) {
        return this.#base.postAsync(`${this.route}/sendEmail`, data);
    }
}