<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\BackgroundData\CodebinaModel;

#[a\Table(model:CodebinaModel::class)]
class CodebinaDataRepository extends Repository {

}
?>