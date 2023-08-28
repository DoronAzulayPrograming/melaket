<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\Warehouse;

#[a\Table(model:Warehouse::class)]
class WarehouseRepository extends Repository {
    function getLastInserted(){
        return $this->where("id", "=", $this->lastInsertId())->single();
    }
}
?>