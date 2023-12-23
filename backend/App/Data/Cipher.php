<?php 
namespace App\Data;

class Cipher {
    private $cipher = "AES-128-CTR";
    private $iv = '1234567891011121';
    private $key; 

    public function __construct(string $key) {
        $this->key = $key;
    }

    public function encrypt($number) {
        $encrypted = openssl_encrypt($number, $this->cipher, $this->key, 0, $this->iv);
        return strtr($encrypted, '+/=', '-_,');
    }

    public function decrypt($encrypted) {
        $encrypted = strtr($encrypted, '-_,', '+/=');
        return openssl_decrypt($encrypted, $this->cipher, $this->key, 0, $this->iv);
    }

    public function validate($encrypted, $number) {
        return $this->decrypt($encrypted) == $number;
    }
}

?>