<?php 
namespace App\Models; 
 
use DafCore\AutoConstruct;
use DafDb\DateOnly;

class UserCreateModel extends AutoConstruct { 
    public int $id = 0;
    public string $email = "";
    public string $password = "";
    public array $roles = [];
    public DateOnly $createDate;

    function rolesToString() : string {
        return implode(",", $this->roles);
    }

    function getModelForDb() : array {
        $arr = (array) $this;
        $arr["roles"] = $this->rolesToString();
        return $arr;
    }
}
?>