<?php
namespace App\Controllers\Api;

use App\Middlewheres\Auth;
use App\Repositories\ModelsRepository;
use DafCore\ApiController;
use DafCore\AutoConstruct;
use DafCore\Controller\Attributes as a;
use DafCore\Request;

#[a\Route(prefix:"api")]
class CheetahApiController extends ApiController {

    function __construct(
        public ModelsRepository $mrepo
    ) {}

    // GET: /api/Cheetah/validate/CityName
    #[Auth]
    #[a\HttpGet("/validate/:city")]
    function index_validate(Request $req,string $city){

        if(!$this->mrepo->where("businessId","=",$req->user->businessId)->where("name","=","קונימבו")->exists())
            return $this->badRequset("לעסק אין מודל קונימבו פעיל.");

        $konimboModel = $this->mrepo->where("businessId","=",$req->user->businessId)->where("name","=","קונימבו")->single();

        try {

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_TIMEOUT => 600,
                CURLOPT_CONNECTTIMEOUT => 0,
                CURLOPT_URL => "https://chita-il.com/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=get_city_ajax&term=".$city,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => array("Authorization: Bearer " . $konimboModel->data->shippingToken),
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_SSL_VERIFYPEER => false
            ]);
    
            $resp = curl_exec($ch);
            curl_close($ch);

            $res = new \stdClass();
            $res->result = true;
            $res->msg = $city;

            $result = json_decode($resp, true);
            if(!is_array($result)) {// return $this->internalError();
                $res->result = false;
            }
            
            if(empty($result[0]['city_code']))
                $res->result = false;

        } catch (\Throwable $th) {
            return $this->internalError();
        }
    
        return $this->ok($res);
    }

    // GET: /api/Cheetah/validate_form?businessId=32&q=נתינה
    #[a\HttpGet("/validate_form")]
    function index_validate_form(int $businessId, string $q = ''){

        if(!$this->mrepo->where("businessId","=",$businessId)->where("name","=","קונימבו")->exists())
            return $this->badRequset("לעסק אין מודל קונימבו פעיל.");

        $konimboModel = $this->mrepo->where("businessId","=",$businessId)->where("name","=","קונימבו")->single();

        if(str_contains($q, " "))
            $q = urlencode($q);

        try {

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_TIMEOUT => 600,
                CURLOPT_CONNECTTIMEOUT => 0,
                CURLOPT_URL => "https://chita-il.com/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=get_city_ajax&term=".$q,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => array("Authorization: Bearer " . $konimboModel->data->shippingToken),
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_SSL_VERIFYPEER => false
            ]);
    
            $resp = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($resp, true);

        } catch (\Throwable $th) {
            return $this->internalError();
        }

        if(!$result || !is_array($result)) return $this->internalError();

        if(!empty($result[0]['city_code'])) {
            $result = array_map(fn($result_item) => array(
                'id' => trim($result_item['city_code']),
                'name' => trim($result_item['city_name']),
                'value' => trim($result_item['city_code'])
            ), $result);
            return $this->ok($result);
        }

        return $this->ok("[]");
    }

    // GET: /api/Cheetah/validate_form_street/CityName/32?q=המסגר
    #[a\HttpGet("/validate_form_street/:city/:businessId")]
    function index_validate_form_street(int $city, int $businessId, string $q = ''){

        if(!$this->mrepo->where("businessId","=",$businessId)->where("name","=","קונימבו")->exists())
            return $this->badRequset("לעסק אין מודל קונימבו פעיל.");

        $konimboModel = $this->mrepo->where("businessId", "=", $businessId)->where("name", "=", "קונימבו")->single();

        try {

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_TIMEOUT => 600,
                CURLOPT_CONNECTTIMEOUT => 0,
                CURLOPT_URL => 'https://chita-il.com/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=get_streets_ajax&ARGUMENTS=-N' . urlencode($city) . '&term=' . urlencode($q),
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => array("Authorization: Bearer " . $konimboModel->data->shippingToken),
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_SSL_VERIFYPEER => false
            ]);

            $resp = curl_exec($ch);
            curl_close($ch);

            $result = json_decode($resp, true);

        } catch (\Throwable $th) {
            return $this->internalError();
        }

        $arr = [];
        if (!$result || !is_array($result)) return $this->internalError();

        foreach($result as $item) {
            $names = array_column($arr, 'name');
            if(in_array($item['street_name'], $names)) continue;
            $arr[] = array(
                'id' => trim($item['street_code']),
                'name' => trim($item['street_name']),
                'value' => trim($item['street_code'])
            );
        }

        return $this->ok($arr);
    }

    #[Auth]
    #[a\HttpPost("/create-shipment/:businessId")]
    public function createChitaShipmentFromKonimboData(int $businessId, CreateChitaShipmentModel $body)
    {
        if (!$this->mrepo->where("businessId", "=", $businessId)->where("name", "=", "קונימבו")->exists())
            return $this->badRequset("לעסק אין מודל קונימבו פעיל.");

        $konimboModel = $this->mrepo->where("businessId", "=", $businessId)->where("name", "=", "קונימבו")->single();

        $ip = 'https://chita-il.com';
        $P1 = $body->shippingAuth;                //KonimboWarehouse shippingAuth
        $P2 = 'מסירה';
        $P3 = $body->shippingCode == $body->codeBinaB2CItemNumber ? '140' : '240'; // משלוח עד הבית 140 - נקודת איסוף 240
        $P4 = '4';
        $P5 = $body->shopName;
        $P6 = '';
        $P7 = $body->shippingCode == $body->codeBinaB2CItemNumber ? ($body->bigOrder == 1 ? '150' : '110') : '192';
        $P8 = $body->shippingCode == $body->codeBinaB2CItemNumber ? '110' : '';
        $P9 = $body->shippingCode == $body->codeBinaB2CItemNumber ? 1 : '';
        $P10 = '';
        $P11 = $body->name;
        $P12 = '';
        $P13 = $body->shippingCode == $body->codeBinaB2CItemNumber ? $body->address->city : $body->chitaPoint->cityName;
        $P14 = '';
        $P15 = str_replace(',', ' ', $body->shippingCode == $body->codeBinaB2CItemNumber ? $body->address->street : $body->chitaPoint->cityName);
        $P16 = $body->shippingCode == $body->codeBinaB2CItemNumber ? $body->address->street_number : 1;
        $P17 = '';
        $P18 = '';
        $P19 = $body->shippingCode == $body->codeBinaB2CItemNumber ? (isset($body->address->apartment) ? $body->address->apartment : '') : '';
        $P20 = $body->phone;
        $P21 = '';
        $P22 = $body->orderId;
        $P23 = $body->shippingCode == $body->codeBinaB2CItemNumber ? $body->packageAmount : 1;
        $P24 = $body->notes == 1 ? str_replace(array("'", ","), "", htmlspecialchars($body->notes)) : '';
        $P25 = '';
        $P26 = '';
        $P27 = '';
        $P28 = '';
        $P29 = '';
        $P30 = '';
        $P31 = '';
        $P32 = '';
        $P33 = '';
        $P34 = '';
        $P35 = $body->shippingCode == $body->codeBinaB2CItemNumber ? '' : $body->chitaPoint->point;
        $P36 = 'XML';
        $P37 = '';
        $P38 = 'konimbo';
        $P39 = '';
        $P40 = $body->email;
        $url = $ip . '/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ship_create_anonymous&ARGUMENTS=-N' . urlencode($P1) . ',-A' . urlencode($P2) . ',-N' . urlencode($P3) . ',-N' . urlencode($P4) . ',-A' . urlencode($P5) . ',-A' . urlencode($P6) . ',-N' . urlencode($P7) . ',-N' . urlencode($P8) . ',-N' . urlencode($P9) . ',-N' . urlencode($P10) . ',-A' . urlencode($P11) . ',-A' . urlencode($P12) . ',-A' . urlencode($P13) . ',-A' . urlencode($P14) . ',-A' . urlencode($P15) . ',-A' . urlencode($P16) . ',-A' . urlencode($P17) . ',-A' . urlencode($P18) . ',-A' . urlencode($P19) . ',-A' . urlencode($P20) . ',-A' . urlencode($P21) . ',-A' . urlencode($P22) . ',-A' . urlencode($P23) . ',-A' . urlencode($P24) . ',-A' . urlencode($P25) . ',-A' . urlencode($P26) . ',-A' . urlencode($P27) . ',-A' . urlencode($P28) . ',-N' . urlencode($P29) . ',-N' . urlencode($P30) . ',-N' . urlencode($P31) . ',-A' . urlencode($P32) . ',-A' . urlencode($P33) . ',-N' . urlencode($P34) . ',-N' . urlencode($P35) . ',-A' . urlencode($P36) . ',-A' . urlencode($P37) . ',-A' . urlencode($P38) . ',-A' . urlencode($P39) . ',-A' . urlencode($P40) . '';

        $curl = curl_init();
 
		curl_setopt_array($curl, [
		CURLOPT_URL => $url,
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_ENCODING => "",
		CURLOPT_MAXREDIRS => 10,
		CURLOPT_TIMEOUT => 60,
		CURLOPT_CUSTOMREQUEST => "GET",
		CURLOPT_POSTFIELDS => "",
		CURLOPT_HTTPHEADER => [
			"Authorization: Bearer ".$konimboModel->data->shippingToken
		],
		CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
		CURLOPT_COOKIEFILE => 'cookie.txt',
		CURLOPT_COOKIEJAR => 'cookie.txt'
		]);
 
		$resp = [];
 
		$response = curl_exec($curl);
		$err = curl_error($curl);
        curl_close($curl);
 
		if($err) {
			$resp = array(
				'shipment_tracking' => 'שגיאה: '.(string) $err,
				'shipment_id' => 'error'
			);
            return $this->Response()->status(404)->json($resp);
		}
		
		$xml = simplexml_load_string($response, 'SimpleXMLElement',LIBXML_NOCDATA);
 
		if(!($xml->result == 'ok' && $xml->task == 'ws simple ship create answer' && $xml->mydata->answer->ship_create_num != '0')) 
		{
            $resp = array(
                'shipment_tracking' => 'שגיאה: '.(string) $response,
                'shipment_id' => 'error'
            );
            return $this->Response()->status(404)->json($resp);
		}

        $resp = array(
            'shipment_tracking' => (string) $xml->mydata->answer->ship_num_rand,
            'shipment_id' => (string) $xml->mydata->answer->ship_create_num
        );

        return $this->Response()->status(200)->json($resp);
    }
}


class CreateChitaShipmentModel extends AutoConstruct
{
    #[\DafCore\NotNullNotEmpty]
    public string $codeBinaPointItemNumber;

    #[\DafCore\NotNullNotEmpty]
    public string $codeBinaB2CItemNumber;



    #[\DafCore\NotNullNotEmpty]
    public string $shippingAuth;

    #[\DafCore\NotNullNotEmpty]
    public string $shopName;
    
    #[\DafCore\NotNullNotEmpty]
    public int $orderId;
    
    #[\DafCore\NotNullNotEmpty]
    public string $name;

    #[\DafCore\NotNullNotEmpty]
    public string $phone;

    #[\DafCore\NotNullNotEmpty]
    public string $email;

    public string $notes;

    public ChitaPointModel $chitaPoint;
    public function setChitaPoint(array $data){
        $this->chitaPoint = new ChitaPointModel($data);
    }
    
    public ChitaAddressModel $address;
    public function setAddress(array $data){
        $this->address = new ChitaAddressModel($data);
    }

    #[\DafCore\NotNullNotEmpty]
    public string $shippingCode;

    public bool $bigOrder;
    
    #[\DafCore\NotNullNotEmpty]
    public int $packageAmount;

    public bool $copyNoteToShipping;
}

class ChitaPointModel extends AutoConstruct
{
    #[\DafCore\NotNullNotEmpty]
    public string $cityName;

    #[\DafCore\NotNullNotEmpty]
    public int $point;
}


class ChitaAddressModel extends AutoConstruct
{
    #[\DafCore\NotNullNotEmpty]
    public string $city;

    #[\DafCore\NotNullNotEmpty]
    public string $street;

    #[\DafCore\NotNullNotEmpty]
    #[\DafCore\Range(1)]
    public int $street_number;
    public int $apartment;
}
?>