<?php 
namespace App\Models; 

use DafDb as a;
use DafCore\AutoConstruct; 
use DafDb\OnDeleteAction;

class Warehouse extends AutoConstruct { 
    #[a\PrimaryKey]
    #[a\AutoIncrement]
    public int $id;

    #[a\NotNull]
    #[a\ForeignKey('Business','id', OnDeleteAction::CASCADE->value)]
    public int $businessId;

    #[a\NotNull]
    public int $warehouseId;


    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(64)]
    public string $warehouseName;

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(128)]
    public string $warehouseOrderStatus;

    #[a\NotNull]
    #[a\DefaultValue("")]
    #[a\Length(128)]
    public string $warehousePickupStatus;
}

class WarehouseValidation {
    static $error = "";
    static function Put($body) : bool {
        self::$error = "";
        $msg = "";
        $status = true;
        if(isset($body->warehouseId) && !is_int($body->warehouseId) && $body->warehouseId < 1)
        {
            $msg .= "warehouseId can't be empty, and must be an integer.";
            $status = false;
        }
        if(isset($body->businessId) && !is_int($body->businessId) && $body->businessId < 1)
        {
            $msg .= "businessId can't be empty, and must be an integer.";
            $status = false;
        }
        if(isset($body->warehouseName) && strlen($body->warehouseName) > 64)
        {
            $msg .= "warehouseName can't be longer than 64 characters.";
            $status = false;
        }
        if(isset($body->warehouseOrderStatus) && strlen($body->warehouseOrderStatus) > 128)
        {
            $msg .= "warehouseOrderStatus can't be longer than 128 characters.";
            $status = false;
        }
        if(isset($body->warehousePickupStatus) && strlen($body->warehousePickupStatus) > 128)
        {
            $msg .= "warehousePickupStatus can't be longer than 128 characters.";
            $status = false;
        }
        self::$error = $msg;
        return $status;
    }
    static function Post($body) : bool {
        self::$error = "";
        $msg = "";
        $status = true;
        if(empty($body->warehouseId) || (!is_int($body->warehouseId) || $body->warehouseId < 1))
        {
            $msg .= "warehouseId is required, can't be empty, and must be an integer.";
            $status = false;
        }
        if(empty($body->businessId) || (!is_int($body->businessId) || $body->businessId < 1))
        {
            $msg .= "businessId is required, can't be empty, and must be an integer.";
            $status = false;
        }
        if(empty($body->warehouseName) || strlen($body->warehouseName) > 64)
        {
            $msg .= "warehouseName is required, and can't be longer than 64 characters.";
            $status = false;
        }
        if(empty($body->warehouseOrderStatus) || strlen($body->warehouseOrderStatus) > 128)
        {
            $msg .= "warehouseOrderStatus is required, and can't be longer than 128 characters.";
            $status = false;
        }
        if(empty($body->warehousePickupStatus) || strlen($body->warehousePickupStatus) > 128)
        {
            $msg .= "warehousePickupStatus is required, and can't be longer than 128 characters.";
            $status = false;
        }
        self::$error = $msg;
        return $status;
    }
}
?>