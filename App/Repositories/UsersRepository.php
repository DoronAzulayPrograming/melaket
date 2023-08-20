<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\User;

#[a\Table(model:User::class)]
class UsersRepository extends Repository {
    function getLastInserted(){
        return $this->where("id", "=", $this->lastInsertId())->single();
    }
}
?>