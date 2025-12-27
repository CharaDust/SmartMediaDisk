//----------------------------------------------
/*
Function Desc:	Trim String
Function Num:	4
Function List:  Trim(str)
				LTrim(str)
				RTrim(str)
				AllTrim(str)
*/
//----------------------------------------------
//去掉空格（字符串两端）
function Trim(ui){ 
	var notValid=/(^\s)|(\s$)/; 
	while(notValid.test(ui))
	{ 
		ui=ui.replace(notValid,"");
	} 
	return ui;
} 

//去掉空格（字符串左边）
function LTrim(ui){
	var notValid=/^\s/; 
	while(notValid.test(ui))
	{ 
		ui=ui.replace(notValid,"");
	} 
	return ui;
} 

//去掉空格（字符串右边）
function RTrim(ui){ 
	var notValid=/\s$/; 
	while(notValid.test(ui))
	{ 
		ui=ui.replace(notValid,"");
	} 
	return ui;
} 

//去掉空格（字符串中所有位置）
function AllTrim(ui){ 
	var notValid=/\s/; 
	while(notValid.test(ui))
	{ 
		ui=ui.replace(notValid,"");
	} 
	return ui;
} 
//----------------------------------------------
/*
Function Desc:	Check inputtext ,
Function Num:	5
Function List:  CheckTrueName(str)		身份证号码检查15/18位,(TaiWan/HongKong/China Other Area)
				CheckID(str)
				CheckMobile(str)
				CheckEmail(str)
				CheckBP(str)
*/
//----------------------------------------------
//检查数字，不允许包含非数字内容
function IsNum(str)
{
	var sReg = /\D+/;
	if ( sReg.test(str) )
	{
		return false;
	}
	return true;
}
//检查姓名，不允许包括空格及数字
function CheckTrueName(str){
	//姓名中不允许数字或空格
	var sReg = /\d|\s/;
	if ( sReg.test(str) )
	{
		alert("真实姓名不允许包含空格或数字！");
		return false;
	}
	//姓名中不允许英文字母
	var sReg = /[a-zA-Z]/;
	if ( sReg.test(str) )
	{
		alert("真实姓名不允许包含英文字母！\n如果您身份证上姓名不是中文，请电话和我们联系。");
		return false;
	}
	if ( str.length > 4 )
	{
		alert("姓名太长！");
		return false;
	}

	return true;
}

//身份证号码有效性检查
function CheckID(str){		//一般性检查，不检查恶意写错
	//18位身份证
	if ( str.length == 18 )
	{
		var sReg = /\d{6}(\d{4})(\d{2})(\d{2})[a-zA-Z\d]{4}/;
		var HasError = false;
		if ( ! sReg.test(str) )
		{
			HasError = true;
		}
		else
		{
			str.match(sReg);
			if ( (RegExp.$1 < 1950 || RegExp.$1 > 1990) || (RegExp.$2 < 1 || RegExp.$2 > 12) || (RegExp.$3 < 1 || RegExp.$3 > 31) )
			{
				//alert(RegExp.$1 + " " + RegExp.$2 + " " + RegExp.$3);
				HasError = true;
			}
		}
		//------------------------------
		if ( HasError )
		{
			alert("18位身份证号码不符合编码规则！");
			return false;
		}
	} 
	//15位身份证
	else if ( str.length == 15 )
	{
		var sReg = /\d{6}(\d{2})(\d{2})(\d{2})\d{3}/;
		var HasError = false;
		if ( ! sReg.test(str) )
		{
			HasError = true;
		}
		else
		{
			str.match(sReg);
			if ( (RegExp.$1 < 50 || RegExp.$1 > 90) || (RegExp.$2 < 1 || RegExp.$2 > 12) || (RegExp.$3 < 1 || RegExp.$3 > 31) )
			{
				//alert(RegExp.$1 + " " + RegExp.$2 + " " + RegExp.$3);
				HasError = true;
			}
		}
		//------------------------------
		if ( HasError )
		{
			alert("15位身份证号码不符合编码规则！");
			return false;
		}
	}
	//台湾身份证10位，格式为 A123456789 ,首位为字母，后面9位数字
	else if ( str.length == 10 )
	{
		var sReg = /[a-zA-Z]{1}[0-9]{9}/;
		if ( ! sReg.test(str) )
		{
			alert("台湾身份证号码格式有误！\n注意不能包含除数字和字母外的其他字符。");
			return false;
		}
	} 
	//香港身份证8位，格式为 A123456(7) ,首位为字母，后面7位数字
	else if ( str.length == 8 )
	{
		var sReg = /[a-zA-Z]{1}[0-9]{7}/;
		if ( ! sReg.test(str) )
		{
			alert("香港身份证号码格式有误！\n注意不能包含除数字和字母外的其他字符。");
			return false;
		}
	} 
	//非法证件号 或者 未知证件号
	else
	{
		alert("身份证号码非法！必须为8位(香港)、10位(台湾地区)、15位或18位。\n如果您使用其他国家或地区的身份证，请通过电话或者Email和我们联系。");
		return false;
	}
	return true;
}
//检查手机号码：允许仅包括数字，且长度等于11位
function CheckMobileNum(str)
{
	var sReg1 = /^13[0-9]{1}\d{8}$/;
	if (!sReg1.test(str)) 
	{
		return false;
	}
	return true;
}
//检查电话号码：允许仅包括数字、减号和小括号，且长度小于等于15位
function CheckMobile(str){
	if ( str.length <= 15 && str.length >= 8 )
	{
		var sReg = /[^\d-\(\)]{1}/;
		var sReg1 = /^13[0-9]{1}\d{8}$/;
		var sReg2 = /[-\(\)]{1}/;
		var HasError = false;
		if (sReg.test(str))
		{
			HasError = true;
			alert("电话号码不能包含除数字，小括号，减号以外字符！");
			return false;
		}
		else
		{
			if ( str.length == 11 && !sReg1.test(str) && !sReg2.test(str)  )
			{
				HasError = true;
				alert("您输入的手机号码有误！\n如果是非手机号码，请在区号和号码间加短横线“-”。");
				return false;
			}
			if ( (str.length == 12 || str.length == 10) && !sReg2.test(str) )
			{
				HasError = true;
				alert("您输入的如果是手机号码，则位数有误，必须为11位！\n如果是非手机号码，请在区号和号码间加短横线“-”。");
				return false;
			}
		}
	}
	else
	{
		HasError = true;
		alert("电话号码必须是小于等于15位且大于等于8位！");
		return false;
	}

	if ( HasError )
	{
		//alert("");
		return false;
	}
	return true;
}

//检查Email地址
function CheckEmail(str){
	var sReg = /[_a-zA-Z\d\-\.]+@[_a-zA-Z\d\-]+(\.[_a-zA-Z\d\-]+)+$/;
	if ( ! sReg.test(str) )
	{
		alert("Email地址错误！请重新输入。");
		return false;
	}

	return true;
}

//检查BP机号码
function CheckBP(str){
	var sReg = /[\(]{0,1}\d+[-\)]{0,1}\d/;
	if ( ! sReg.test(str) )
	{
		alert("BP机号码错误，仅允许包括括号，减号和数字。\n格式为(xxx)xxxxxx或者xxx-xxxxxx，其中x代表数字。");
		return false;
	}

	return true;
}
//----------------------------------------------
/*
Function Desc:	Pop New Window
Function Num:	2
Function List:  PopImage(ImgSrc,Desc)		
				PopWin(sURL,sfrmName,sOption)
*/
//----------------------------------------------
//弹出无边框窗体，里面显示图片一张，图片和窗体无缝隙，允许定义图片地址以及图片描述，描述不可以换行
function PopImage(ImgSrc,Desc)
{
	if (Desc == "")
		Desc = "查看大图";
	window.open('../ShowPic.asp?src=' + ImgSrc + '&Desc=' + Desc,'','width=200,height=160,status=0,resizable=1,scrollbars=0');
}

//弹出窗体，允许自定义地址，窗体名，打开时的参数
function PopWin(sURL,sfrmName,sOption)
{
	window.open(sURL,sfrmName,sOption);
}
//----------------------------------------------
/*
Function Desc:	预览图片
Function Num:	1
Function List:  PreviewPic(ObjSrc,ObjTarget)		
*/
//----------------------------------------------
//查看客户端图片（无须上传情况下即可查看，没有限制显示图片的大小）
function PreviewPic(ObjSrc,ObjTarget)
{
	ObjSrc = eval(ObjSrc);
	ObjTarget = eval(ObjTarget);

	ObjTarget.style.display = "";
	if( ObjSrc != "" )
	{
		ObjTarget.src = ObjSrc.value;
	}
	else
	{
		ObjTarget.style.display = "none";
	}
}


