<?php 
namespace App\Repositories;

use App\Models\BackgroundData\CheetahModel;
use DafDb as a;
use DafDb\Mysql\Repository;

#[a\Table(model:CheetahModel::class)]
class CheetahRepository extends Repository {

    public function truncateTable(){
        $this->customQuery("TRUNCATE TABLE ".$this->tableName);
    }

}
?>