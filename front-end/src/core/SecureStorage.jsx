import CryptoJS from 'crypto-js';

class SecureStorage {
  constructor(storageType) {
    this.storage = storageType;
    this.secretKey = 'my-secret-key'; // Replace with your own secret key
  }

  // Encrypt the data and store it in the storage type
  setItem(key, value) {
    const encryptedValue = CryptoJS.AES.encrypt(JSON.stringify(value), this.secretKey).toString();
    this.storage.setItem(key, encryptedValue);
  }

  // Get the encrypted data from the storage type and decrypt it
  getItem(key) {
    const encryptedValue = this.storage.getItem(key);
    if (!encryptedValue) {
      return null;
    }

    try{
      const bytes = CryptoJS.AES.decrypt(encryptedValue, this.secretKey);
      const decryptedValue = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      
      const currentUnixTimestamp = Math.floor(Date.now() / 1000);
      
      if (!decryptedValue || currentUnixTimestamp > decryptedValue.expiryTime) {
        this.removeItem(key);
        return null;
      }

      return decryptedValue;
    }catch(error){
      //console.error(error)
      return false;
    }
  }

  // Remove the data from the storage type
  removeItem(key) {
    this.storage.removeItem(key);
  }

  // Get the JWT token from the storage type
  getToken() {
    const item = this.getItem('u');
    return item ? item.token : null;
  }

  // Get the user roles from the JWT token stored in the storage type
  getUserRoles() {
    const decodedToken = this.getItem('u');
    return decodedToken?.roles || [];
  }
}

// Create an instance of SecureStorage with session storage
export const secureSessionStorage = new SecureStorage(sessionStorage);

// Create an instance of SecureStorage with local storage
export const secureLocalStorage = new SecureStorage(localStorage);
