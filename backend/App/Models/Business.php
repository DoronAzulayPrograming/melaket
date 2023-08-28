<?php 
namespace App\Models; 
 
use DafDb as a;
use DafCore\AutoConstruct;
use DafDb\DateOnly;
 
class Business extends AutoConstruct implements \JsonSerializable { 
 
    #[a\PrimaryKey]
    #[a\AutoIncrement]
    public int $id;

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(128)]
    public string $name;

    #[a\Unique]
    #[a\NotNull]
    #[a\Length(191)]
    #[a\DefaultValue("")]
    public string $email;

    #[a\NotNull]
    #[a\DefaultValue("")]
    public string $codeBinaHost;

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(64)]
    public string $codeBinaUser;

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(64)]
    public string $codeBinaPassword;

    #[a\NotNull]
    #[a\DefaultValue(0)] // Customer Account Number in Bnext Code Bina ERP, in order to create invoices for the services
    public int $customerNoInBina;

    #[a\NotNull]
    #[a\DefaultValue("CURRENT_DATE")]
    public DateOnly $createDate;

    public function setCreateDate(string $date){
        $this->createDate = new DateOnly($date);
    }

    #[a\DbInclude('Users','Users.businessId = Business.id', User::class)]
    public array $users;

    #[a\DbInclude('Warehouse','Warehouse.businessId = Business.id', Warehouse::class)]
    public array $warehouses;
}


class BusinessValidation {
    /* 
    Left to validate:
    "customerNoInBina": 0,
    */
    static $error = "";
    static function Put($body) : bool {
        self::$error = "";
        $msg = "";
        $status = true;

        if(isset($body->email) && (strlen($body->email) > 191 || !filter_var($body->email, FILTER_VALIDATE_EMAIL))) {
            $msg .= "Email can't be longer than 191 characters and must be in valid format.";
            $status = false;
        }
        if(isset($body->codeBinaHost) && !preg_match('%^((https?://)|(www\.))([a-z0-9-].?)+(:[0-9]+)?(/.*)?$%i', $body->codeBinaHost)) 
        {
            $msg .= "codeBinaHost must be a valid URL.";
            $status = false;
        }
        if(isset($body->name) && strlen($body->name) > 128) 
        {
            $msg .= "Name can't be longer than 128 characters.";
            $status = false;
        }
        if(isset($body->codeBinaUser) && strlen($body->codeBinaUser) > 64)
        {
            $msg .= "codeBinaUser can't be longer than 64 characters.";
            $status = false;
        }
        if(isset($body->codeBinaPassword) && strlen($body->codeBinaPassword) > 64) 
        {
            $msg .= "codeBinaPassword can't be longer than 64 characters.";
            $status = false;
        }
        self::$error = $msg;
        return $status;
    }
    
    static function Post($body) : bool {
        self::$error = "";
        $msg = "";
        $status = true;

        if(!isset($body->id) || $body->id != 0){
            $msg .= "id field need to be 0 on create";
            $status = false;
        }

        if(empty($body->email) || strlen($body->email) > 191 || !filter_var($body->email, FILTER_VALIDATE_EMAIL)) {
            $msg .= "Email is required, must be in valid format, and can't be longer than 191 characters.";
            $status = false;
        }
        if(empty($body->codeBinaHost) || !preg_match('%^((https?://)|(www\.))([a-z0-9-].?)+(:[0-9]+)?(/.*)?$%i', $body->codeBinaHost)) 
        {
            $msg .= "codeBinaHost is required and must be a valid URL.";
            $status = false;
        }
        if(empty($body->name) || strlen($body->name) > 128) 
        {
            $msg .= "Name is required and can't be longer than 128 characters.";
            $status = false;
        }
        if(empty($body->codeBinaUser) || strlen($body->codeBinaUser) > 64)
        {
            $msg .= "codeBinaUser is required and can't be longer than 64 characters.";
            $status = false;
        }
        if(empty($body->codeBinaPassword) || strlen($body->codeBinaPassword) > 64) 
        {
            $msg .= "codeBinaPassword is required and can't be longer than 64 characters.";
            $status = false;
        }
        self::$error = $msg;
        return $status;
    }
}

/*


    #[a\DefaultValue(0)] // Does this business has the Likut Module or not?
    public bool $melaketModule;

    #[a\DefaultValue(0)] // Pricing Type, true = fix price, false = price per user
    public bool $melaketPricing;

    #[a\DefaultValue(0)] // Fix Price / Price Per User
    public int $melaketUnitPricing;

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(32)] // MD5 Hash Length
    public string $konimboApiToken;

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(32)] // MD5 Hash Length
    public string $konimboDebitToken;

    #[a\NotNull]
    #[a\DefaultValue("")]
    public string $konimboDebitURL;
    
    #[a\NotNull]
    #[a\DefaultValue(0)]
    public int $codeBinaMainAccount; // What is the account for invoices creation?

    #[a\NotNull]
    #[a\DefaultValue(0)]
    public int $codeBinaPayPalAccount; // What is the account for recipets in Code Bina? (For PayPal)

    #[a\NotNull]
    #[a\DefaultValue(0)]
    public int $codeBinaCreditCardAccount; // What is the account for recipets in Code Bina? (For Credit Card)

    #[a\NotNull]
    #[a\DefaultValue(0)]
    public int $codeBinaBitAccount; // What is the account for recipets in Code Bina? (For Bit)

    #[a\NotNull]
    #[a\DefaultValue(0)]
    public int $shippingCompany; // Shipping company identifier in our system

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(191)]
    public string $brandedEmail;

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(100)]
    public string $brandedEmailSgToken;

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(64)]
    public string $brandedEmailShopName;

    #[a\NotNull]
    #[a\DefaultValue("")]
    public string $brandedEmailSendTemplate;

    #[a\NotNull]
    #[a\DefaultValue("")]
    public string $brandedEmailPickupTemplate;

*/
?>