<?php 
namespace App\Models\BackgroundData; 
 
use DafDb as a; 
use DafCore\AutoConstruct; 
 
class CheetahModel extends AutoConstruct { 

    #[a\PrimaryKey]
    public int $lockerCode;

    #[a\NotNull]
    #[a\Length(72)]
    public string $lockerCity;

    #[a\NotNull]
    public string $lockerText;
}
?>