<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Context;
use DafDb\Mysql\Repository;

use App\Models\Business\Business;

#[a\Table(model:Business::class)]
class BusinessRepository extends Repository {

    public function __construct(Context $context)
    {
        parent::__construct($context);

        if(!$this->existsWhere("id", "=", "1")){
            /*$this->customQuery(
            "INSERT INTO `".$this->tableName."` 
            (`id`, `name`, `email`, `codeBinaHost`, `codeBinaUser`, `codeBinaPassword`, `customerNoInBina`, `createDate`)
             VALUES ('1', 'מערכת', '', '', '', '', '0', '');"
            );*/
            $this->customQuery(
            "INSERT INTO `".$this->tableName."` 
            (`id`, `name`, `email`, `createDate`)
             VALUES ('1', 'מערכת', '','');"
            );
        }   
    }

    function getLastInserted(bool $cast_to_model = true) : Business {
        return $this->where("id", "=", $this->lastInsertId())->single($cast_to_model);
    }
}
?>