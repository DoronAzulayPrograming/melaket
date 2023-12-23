<?php 
namespace App\Models;

use App\Models\Business\Business;
use DafDb as a;
use DafCore\AutoConstruct; 
use DafDb\OnDeleteAction;

class Warehouse extends AutoConstruct { 

    #[a\PrimaryKey]
    #[a\AutoIncrement]
    public int $id;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    #[a\NotNull]
    #[a\ForeignKey('Business','id', OnDeleteAction::CASCADE->value)]
    public int $businessId;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    #[a\NotNull]
    #[a\DefaultValue(0)]
    public int $warehouseId;

    #[\DafCore\NotNullNotEmpty]
    #[a\NotNull]
    #[a\DefaultValue("")]
    #[\DafCore\Length(64)]
    public string $warehouseName;

    #[a\DbInclude('Business','Business.id = Warehouses.businessId')]
    public Business $business;

    #[a\DbInclude('UsersWarehouses','UsersWarehouses.warehouseId = Warehouses.id', UserWarehouse::class)]
    public array $users;

    public function onAfterLoad()
    {
        if(isset($this->users) && !empty($this->users) && isset($this->users[0]->user))
            $this->users = array_map(fn($item) => $item->user,$this->users);
    }
}

class WarehouseValidation {
    static $error = "";
    static function Put($body) : bool {
        self::$error = "";
        $msg = "";
        $status = true;
        if(!isset($body->id) || !is_int($body->id) || $body->id < 1)
        {
            $msg .= "feild id can't be empty, and must be an integer.";
            $status = false;
        }
        if(!isset($body->businessId) && !is_int($body->businessId) && $body->businessId < 1)
        {
            $msg .= "feild businessId can't be empty, and must be an integer.";
            $status = false;
        }
        if(isset($body->warehouseId) && (empty($body->warehouseId) || $body->warehouseId < 1))
        {
            $msg .= "feild warehouseName can't be smaller then 1.";
            $status = false;
        }
        if(isset($body->warehouseName) && (empty($body->warehouseName) || strlen($body->warehouseName) > 64))
        {
            $msg .= "feild warehouseName can't be longer than 64 characters.";
            $status = false;
        }
        self::$error = $msg;
        return $status;
    }
}
?>