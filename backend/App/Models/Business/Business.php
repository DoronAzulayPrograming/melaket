<?php 
namespace App\Models\Business;

use App\Models\CodeBinaBusinessProfile;
use App\Models\Model\Model;
use App\Models\User;
use App\Models\Warehouse;
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
    #[a\DefaultValue("CURRENT_DATE")]
    public DateOnly $createDate;

    public function setCreateDate(string $date){
        $this->createDate = new DateOnly($date);
    }
    
    #[a\DbInclude('CodeBinaBusinessProfiles','CodeBinaBusinessProfiles.businessId = Business.id')]
    public ?CodeBinaBusinessProfile $codeBina;

    #[a\DbInclude('Models','Models.businessId = Business.id', Model::class)]
    public array $models;

    #[a\DbInclude('Users','Users.businessId = Business.id', User::class)]
    public array $users;

    #[a\DbInclude('Warehouses','Warehouses.businessId = Business.id', Warehouse::class)]
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
        if(isset($body->name) && strlen($body->name) > 128) 
        {
            $msg .= "Name can't be longer than 128 characters.";
            $status = false;
        }
        self::$error = $msg;

        return $status;
    }
}
?>