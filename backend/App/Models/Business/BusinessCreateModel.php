<?php 
namespace App\Models\Business;

use App\Models\CodeBinaBusinessProfile;
use DafCore\AutoConstruct;
use DafDb\DateOnly;

class BusinessCreateModel extends AutoConstruct { 

    public int $id;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Length(128)]
    public string $name;

    #[\DafCore\Email]
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Length(191)]
    public string $email;
    
    public ?CodeBinaBusinessProfile $codeBina;
    
    public function setCodeBina(array $data){
        $this->codeBina = new CodeBinaBusinessProfile($data);
    }

    #[\DafCore\ArrayValidateClass(WarehouseCreateForm::class)]
    public array $warehouses;

    public function setWarehouses($warehouses){
        $this->warehouses = [];
        foreach($warehouses as $w){
            $this->warehouses[] = new WarehouseCreateForm($w);
        }
    }

    public DateOnly $createDate;

    public function setCreateDate(string $date){
        $this->createDate = new DateOnly($date);
    }
    
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\ArrayValidateClass(BusinessModalCreateModel::class)]
    public array $models;

    public function setModels($models){
        $this->models = [];
        foreach($models as $model){
            $this->models[] = new BusinessModalCreateModel($model);
        }
    }

    public function onAfterLoad()
    {
        $this->id = 0;
        $this->createDate = DateOnly::Now();
    }
}


class WarehouseCreateForm extends AutoConstruct {
    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    public int $id;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Length(128)]
    public string $name;
}
?>