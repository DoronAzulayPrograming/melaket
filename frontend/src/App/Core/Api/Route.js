// Route.js
/**
 * @typedef IRoute
 * @property {function(string): Promise<any>} getAsync
 * @property {function(string, object): Promise<any>} postAsync
 * @property {function(string, object): Promise<any>} putAsync
 * @property {function(string): Promise<void>} deleteAsync
 */

export default class Route {
    constructor() {
        this._httpClient = { headers:{} }; // This can be the global 'fetch' function or a custom http client
        this.authKey = null;
    }

    setAuthHeader(key) {
        this.authKey = key;
    }

    #addAuthHeader() {
        if (this.authKey) {
            // Add authorization header
            this._httpClient.headers = {
                ...this._httpClient.headers,
                'Authorization': `Bearer ${this.authKey}`
            };
        } else {
            if(this._httpClient.headers)
                delete this._httpClient.headers['Authorization'];
        }
    }

    #removeAuthHeader() {
        this.authKey = null;
    }

    async getAsync(url) {
        this.#addAuthHeader();
        const response = await fetch(url,{
            method: 'GET',
            headers: {
                ...this._httpClient.headers
            }
        });
        this.#removeAuthHeader();
        if (response.ok) {
            return await response.json();
        } else if (response.status === 500) {
            throw new Error("שגיאת שרת פנימית");
        } else if (response.status === 404) {
            throw new Error(`כתובת בקשה ${url} לא נמצאה.`);
        } else {
            throw new Error(await response.text());
        }
    }

    async postAsync(url, data) {
        this.#addAuthHeader();
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: {
                ...this._httpClient.headers
            }
        });
        this.#removeAuthHeader();

        if (response.ok) {
            return await response.json();
        } else if (response.status === 500) {
            throw new Error("שגיאת שרת פנימית");
        } else if (response.status === 400) {
            throw new Error(`שגיאה בבקשה ${url} תבדוק את נתוני השליחה.`);
        } else {
            throw new Error(await response.text());
        }
    }

    async putAsync(url, data) {
        this.#addAuthHeader();
        const response = await fetch(url, {
            method: 'PUT',
            body: JSON.stringify(data),
            headers: {
                ...this._httpClient.headers
            }
        });
        this.#removeAuthHeader();

        if (response.ok) {
            return response;
        } else if (response.status === 500) {
            throw new Error("שגיאת שרת פנימית");
        } else if (response.status === 404) {
            throw new Error(`כתובת בקשה ${url} לא נמצאה.`);
        } else if (response.status === 400) {
            throw new Error(`שגיאה בבקשה ${url} תבדוק את נתוני השליחה.`);
        } else {
            throw new Error(await response.text());
        }
    }

    async deleteAsync(url) {
        this.#addAuthHeader();
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                ...this._httpClient.headers
            }
        });
        this.#removeAuthHeader();

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`כתובת בקשה ${url} לא נמצאה.`);
            } else {
                throw new Error(await response.text());
            }
        }
    }
}