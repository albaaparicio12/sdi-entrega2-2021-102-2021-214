package com.uniovi.tests;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;


//Paquetes JUnit 
import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.FixMethodOrder;
import org.junit.Test;
import org.junit.runners.MethodSorters;
//Paquetes Selenium 
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;

import com.uniovi.tests.pageobjects.PO_OffersView;
//Paquetes con los Page Object
import com.uniovi.tests.pageobjects.PO_PrivateView;
import com.uniovi.tests.pageobjects.PO_UsersListView;
import com.uniovi.tests.pageobjects.PO_View;
import com.uniovi.tests.util.SeleniumUtils;


//Ordenamos las pruebas por el nombre del método
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
public class SdiEntrega2Tests {
	//En Windows (Debe ser la versión 65.0.1 y desactivar las actualizacioens automáticas)):
	static String PathFirefox65 = "C:\\Program Files\\Mozilla Firefox\\firefox.exe"; 
	static String Geckdriver024 = "C:\\geckodriver022win64.exe";
	static WebDriver driver = getDriver(PathFirefox65, Geckdriver024); 
	static String URL = "http://localhost:8081/usuario/add";
	
	static String messagePrincipalUser = "Página Principal Usuario Estandar";
	static String messagePrincipalAdmin = "Página Principal ADMIN";

	public static WebDriver getDriver(String PathFirefox, String Geckdriver) {
		System.setProperty("webdriver.firefox.bin", PathFirefox);
		System.setProperty("webdriver.gecko.driver", Geckdriver);
		WebDriver driver = new FirefoxDriver();
		return driver;
	}


	@Before
	public void setUp(){
		driver.navigate().to(URL);
	}
	@After
	public void tearDown(){
		driver.manage().deleteAllCookies();
	}
	@BeforeClass 
	static public void begin() {
		//Configuramos las pruebas.
		//Fijamos el timeout en cada opción de carga de una vista. 2 segundos.
		PO_View.setTimeout(3);
	}
	@AfterClass
	static public void end() {
		//Cerramos el navegador al finalizar las pruebas
		driver.quit();
	}

	//PR01. Registro de Usuario con datos válidos. /
	@Test
	public void PR01() {
		PO_PrivateView.signup(driver, "usuario2@gmail.com", "Pablo", "Perez", "contraseña123", "contraseña123");
		assertNotNull(PO_View.checkElement(driver, "text", messagePrincipalUser));	
		PO_PrivateView.logout(driver);	
		PO_View.checkElement(driver, "id", "titleLogIn");
	}
	//PR02. Registro de Usuario con datos inválidos (email, nombre y apellidos vacíos). /
	@Test
	public void PR02() {
		PO_PrivateView.signup(driver, "", "", "", "contraseña123", "contraseña123");
		assertNotNull(PO_View.checkElement(driver, "id", "titleSignIn"));						
	}
	//PR03. Registro de Usuario con datos inválidos (repetición de contraseña inválida). /
	@Test
	public void PR03() {
		PO_PrivateView.signup(driver, "usuario3@gmail.com", "Pedro", "Sanchez", "contraseña123", "con");
		assertNotNull(PO_View.checkElement(driver, "id", "titleSignIn"));		
		assertNotNull(PO_View.checkElement(driver, "text", "Error con las passwords, no coinciden"));	
	}
	
	//PR04. Registro de Usuario con datos inválidos (email existente). /
	@Test
	public void PR04() {
		PO_PrivateView.signup(driver, "admin@email.com", "Alba", "Perez", "alba123", "alba123");
		assertNotNull(PO_View.checkElement(driver, "id", "titleSignIn"));			
		assertNotNull(PO_View.checkElement(driver, "text", "Este email ya está registrado"));			
	}
	
	//PR05. Inicio de sesión con datos válidos. /
	@Test
	public void PR05() {
		PO_PrivateView.signup(driver, "usuario3@gmail.com", "Marta", "Sanchez", "contraseña123", "contraseña123");
		PO_PrivateView.logout(driver);	
		PO_View.checkElement(driver, "id", "titleLogIn");
		
		//Se loguea y se comprueba que se muestra el mensaje de la ventana de opciones de usuario, el email y el dinero del usuario.
		PO_PrivateView.login(driver, "usuario3@gmail.com", "contraseña123");
		assertNotNull(PO_View.checkElement(driver, "text", messagePrincipalUser));	
		assertNotNull(PO_View.checkElement(driver, "id", "mEmail"));	
		assertNotNull(PO_View.checkElement(driver, "id", "mDinero"));	
		PO_PrivateView.logout(driver);
		PO_View.checkElement(driver, "id", "titleLogIn");
	}
	//PR06. Inicio de sesión con datos inválidos (email existente, pero contraseña incorrecta). /
	@Test
	public void PR06() {
		PO_PrivateView.signup(driver, "lucia@gmail.com", "Lucia", "Vega", "contraseña123", "contraseña123");
		PO_PrivateView.logout(driver);	
		PO_View.checkElement(driver, "id", "titleLogIn");
		
		//Se loguea y se comprueba que se muestra el mensaje de error, y que no se muestran el email ni el dinero del usuario.
		PO_PrivateView.login(driver, "lucia@gmail.com", "contraseñaIncorrecta");
		assertNotNull(PO_View.checkElement(driver, "text", "Email o password incorrecto"));	
		SeleniumUtils.textoNoPresentePagina(driver, "lucia@gmail.com");	
		SeleniumUtils.textoNoPresentePagina(driver,"Dinero: ");
	}
	
	//PR07. Inicio de sesión con datos inválidos (campo email o contraseña vacíos). /
	@Test
	public void PR07() {
		//Email vacío
		PO_PrivateView.login(driver, "", "contraseña123");	
		assertNotNull(PO_View.checkElement(driver, "id", "titleLogIn"));
		SeleniumUtils.textoNoPresentePagina(driver,"Dinero: ");
		//Contraseña vacía
		PO_PrivateView.login(driver, "lucia@gmail.com", "");	
		assertNotNull(PO_View.checkElement(driver, "id", "titleLogIn"));
		SeleniumUtils.textoNoPresentePagina(driver,"Dinero: ");
	}	
	
	//PR08. Inicio de sesión con datos inválidos (email no existente en la aplicación). /
	@Test
	public void PR08() {
		PO_PrivateView.login(driver, "almendra@gmail.com", "contraseña123");			
		assertNotNull(PO_View.checkElement(driver, "id", "titleLogIn"));
		SeleniumUtils.textoNoPresentePagina(driver, "almendra@gmail.com");	
		SeleniumUtils.textoNoPresentePagina(driver,"Dinero: ");			
	}	
	
	//PR09. Hacer click en la opción de salir de sesión y comprobar que se redirige a la página de inicio de sesión (Login). /
	@Test
	public void PR09() {
		PO_PrivateView.login(driver, "admin@email.com", "admin");	
		
		PO_PrivateView.logout(driver);	
		PO_View.checkElement(driver, "id", "titleLogIn");
		
		SeleniumUtils.textoNoPresentePagina(driver, "admin@email.com");	
		SeleniumUtils.textoNoPresentePagina(driver,"Dinero: ");	
	}	
	//PR10. Comprobar que el botón cerrar sesión no está visible si el usuario no está autenticado. /
	@Test
	public void PR10() {
		SeleniumUtils.textoNoPresentePagina(driver, "Desconectarse");	
	}
		
	
	//PR11. Mostrar el listado de usuarios y comprobar que se muestran todos los que existen en el sistema. /
	@Test
	public void PR11() {
		PO_PrivateView.signup(driver, "alba@email.com", "Alba", "Aparicio", "alba", "alba");
		PO_PrivateView.logout(driver);
		
		PO_PrivateView.login(driver, "admin@email.com", "admin");	
		driver.navigate().to("http://localhost:8081/usuario/listado");
		
		assertNotNull(PO_View.checkElement(driver, "text", "alba@email.com"));
		
	}	
	
	//PR12. Ir a la lista de usuarios, borrar el primer usuario de la lista, comprobar que la lista se actualiza y dicho usuario desaparece. /
	@Test
	public void PR12() {		
		PO_PrivateView.login(driver, "admin@email.com", "admin");	
		
		String firstUser = PO_UsersListView.getUserByFirstPosition(driver);
		
		PO_UsersListView.deleteUserByFirstPosition(driver);
		SeleniumUtils.textoNoPresentePagina(driver, firstUser);	
			
		PO_PrivateView.logout(driver);
	}	
	
	//PR13. Ir a la lista de usuarios, borrar el último usuario de la lista, comprobar que la lista se actualiza y dicho usuario desaparece. /
	@Test
	public void PR13() {
		PO_PrivateView.signup(driver, "juana@gmail.com", "Juana", "Aparicio", "contraseña123", "contraseña123");	
		PO_PrivateView.logout(driver);	
		
		PO_PrivateView.login(driver, "admin@email.com", "admin");	
		
		PO_UsersListView.deleteUserByName(driver, "juana@gmail.com");
		SeleniumUtils.esperarSegundos(driver, 3);
		SeleniumUtils.textoNoPresentePagina(driver, "juana@gmail.com");	
			
		PO_PrivateView.logout(driver);
	}	
		
	
	
	/**PR14. Ir a la lista de usuarios, borrar 3 usuarios, comprobar que la lista se actualiza y dichos
	usuarios desaparecen. */
	@Test
	public void PR14() {
		PO_PrivateView.signup(driver, "juana1@gmail.com", "Juana1", "Aparicio", "contraseña123", "contraseña123");	
		PO_PrivateView.logout(driver);	
		PO_PrivateView.signup(driver, "juana2@gmail.com", "Juana2", "Aparicio", "contraseña123", "contraseña123");	
		PO_PrivateView.logout(driver);	
		PO_PrivateView.signup(driver, "juana3@gmail.com", "Juana3", "Aparicio", "contraseña123", "contraseña123");	
		PO_PrivateView.logout(driver);	
		
		String[] users = {"juana1@gmail.com", "juana2@gmail.com", "juana3@gmail.com"};
		
		PO_PrivateView.login(driver, "admin@email.com", "admin");
		
		PO_UsersListView.deleteUsers(driver, users);
		SeleniumUtils.esperarSegundos(driver, 3);
		SeleniumUtils.textoNoPresentePagina(driver, "juana1@gmail.com");	
		SeleniumUtils.textoNoPresentePagina(driver, "juana2@gmail.com");	
		SeleniumUtils.textoNoPresentePagina(driver, "juana3@gmail.com");	
		
		PO_PrivateView.logout(driver);		
	}	
	
	
	
	/**PR15. Ir al formulario de alta de oferta, rellenarla con datos válidos y pulsar el botón Submit.
	Comprobar que la oferta sale en el listado de ofertas de dicho usuario. */
	
	@Test
	public void PR15() {
		PO_PrivateView.login(driver, "admin@email.com", "admin");		
		
		PO_OffersView.addOffer(driver,"Mesa","Para la cocina",24.0,false);
		
		assertNotNull(PO_View.checkElement(driver, "text", "Mesa"));
		assertNotNull(PO_View.checkElement(driver, "text", "Para la cocina"));
		
		PO_PrivateView.logout(driver);
	}	
	
	/**PR16. Ir al formulario de alta de oferta, rellenarla con datos inválidos (campo título vacío y
	precio en negativo) y pulsar el botón Submit. Comprobar que se muestra el mensaje de campo
	obligatorio. */
	@Test
	public void PR16() {
		PO_PrivateView.login(driver, "admin@email.com", "admin");	
		
		PO_OffersView.addOffer(driver,"","Para la cocina",10,false);
		assertNotNull(PO_View.checkElement(driver, "id", "titleAddOffer"));
		
		PO_OffersView.addOffer(driver,"oferta","descripcion",-7,false);
		assertNotNull(PO_View.checkElement(driver, "text", "El precio de la oferta debe ser mayor que 0."));
		
		PO_PrivateView.logout(driver);
	}	
	
	/**PR017. Mostrar el listado de ofertas para dicho usuario y comprobar que se muestran todas las
	que existen para este usuario. */
	@Test
	public void PR17() {
		PO_PrivateView.signup(driver, "juana@gmail.com", "Juana", "Aparicio", "contraseña123", "contraseña123");		
		
		PO_OffersView.addOffer(driver,"Nevera","Para la cocina",240.0,false);
		PO_OffersView.addOffer(driver,"Alfombra","Para la habitación",10.5,false);
		PO_OffersView.addOffer(driver,"Ducha","Para el baño",427.7,false);
		
		assertNotNull(PO_View.checkElement(driver, "text", "Nevera"));
		assertNotNull(PO_View.checkElement(driver, "text", "Alfombra"));
		assertNotNull(PO_View.checkElement(driver, "text", "Ducha"));
		
		PO_PrivateView.logout(driver);
	}	
	
	/**PR18. Ir a la lista de ofertas, borrar la primera oferta de la lista, comprobar que la lista se
	actualiza y que la oferta desaparece. */
	@Test
	public void PR18() {
		PO_PrivateView.login(driver, "admin@email.com", "admin");
		PO_OffersView.addOffer(driver,"Una oferta","Descripcion de oferta",50.0,false);
		
		String oferta = PO_OffersView.getOfferByFirstPosition(driver);
		
		PO_OffersView.deleteOfferByFirstPosition(driver);			
		SeleniumUtils.textoNoPresentePagina(driver, oferta);
		
		PO_PrivateView.logout(driver);
	}	
	
	/**PR19. Ir a la lista de ofertas, borrar la última oferta de la lista, comprobar que la lista se actualiza
	y que la oferta desaparece. */
	@Test
	public void PR19() {
		PO_PrivateView.login(driver, "admin@email.com", "admin");
		
		//Se crea una oferta y después se borra ya que cuando se crea una oferta siempre se añade al final de la lista.
		PO_OffersView.addOffer(driver,"Ultima oferta","Descripcion de oferta",5.0,false);
				
		PO_OffersView.deleteOfferByName(driver,"Ultima oferta");			
		SeleniumUtils.textoNoPresentePagina(driver,"Ultima oferta");
		
		PO_PrivateView.logout(driver);			
	}	
	
	/**P20. Hacer una búsqueda con el campo vacío y comprobar que se muestra la página que
	corresponde con el listado de las ofertas existentes en el sistema */
	@Test
	public void PR20() {
		PO_PrivateView.signup(driver, "lucas@gmail.com", "Lucas", "Fernandez", "contraseña123", "contraseña123");	
		
		PO_OffersView.addOffer(driver,"1 oferta","Descripcion de oferta",5.0,false);
		PO_OffersView.addOffer(driver,"2 oferta","Descripcion de oferta",75.0,false);
		PO_OffersView.addOffer(driver,"3 oferta","Descripcion de oferta",15.0,false);
		
		PO_OffersView.searchOfferByName(driver, "");
		assertNotNull(PO_View.checkElement(driver, "text", "1 oferta"));
		assertNotNull(PO_View.checkElement(driver, "text", "2 oferta"));
		assertNotNull(PO_View.checkElement(driver, "text", "3 oferta"));
		
		PO_PrivateView.logout(driver);	
	}	
	
	/**PR21. Hacer una búsqueda escribiendo en el campo un texto que no exista y comprobar que se
	muestra la página que corresponde, con la lista de ofertas vacía. */
	@Test
	public void PR21() {
		PO_PrivateView.signup(driver, "luciafer@gmail.com", "Lucia", "Fernandez", "contraseña123", "contraseña123");	
		
		PO_OffersView.searchOfferByName(driver, "ofertaquenoexiste");
		SeleniumUtils.textoNoPresentePagina(driver,"ofertaquenoexiste");
		
		assertEquals(0, PO_OffersView.countRowsSearch(driver));
		
		PO_PrivateView.logout(driver);
	}	
	
	/**PR22. Hacer una búsqueda escribiendo en el campo un texto en minúscula o mayúscula y
	comprobar que se muestra la página que corresponde, con la lista de ofertas que contengan
	dicho texto, independientemente que el título esté almacenado en minúsculas o mayúscula. */
	@Test
	public void PR22() {
		PO_PrivateView.signup(driver, "fer@gmail.com", "Fernando", "Quirantes", "contraseña123", "contraseña123");		
		
		PO_OffersView.addOffer(driver,"OFERTA DE PLAYSTATION","Consola nueva",50.0,false);
		
		PO_OffersView.searchOfferByName(driver, "play");
		assertNotNull(PO_View.checkElement(driver, "text", "OFERTA DE PLAYSTATION"));
		assertEquals(1, PO_OffersView.countRowsSearch(driver));
		
		PO_PrivateView.logout(driver);
	}	
	
	/**PR23. Sobre una búsqueda determinada (a elección de desarrollador), comprar una oferta que
	deja un saldo positivo en el contador del comprobador. Y comprobar que el contador se
	actualiza correctamente en la vista del comprador. */
	@Test
	public void PR23() {
		PO_PrivateView.signup(driver, "nuria@hotmail.com", "Nuria", "Uria", "contraseña123", "contraseña123");			
		PO_OffersView.addOffer(driver,"Cafetera","Cafetera nueva",30.0,false);		
		PO_PrivateView.logout(driver);
		
		PO_PrivateView.signup(driver, "nuria2@hotmail.com", "Nuria2", "Uria2", "contraseña123", "contraseña123");
		PO_OffersView.buyOfferByName(driver, "cafe");
		
		assertEquals(70.0, PO_PrivateView.getMoney(driver),0.01);
		
		PO_PrivateView.logout(driver);
	}	
	
	/**PR24. Sobre una búsqueda determinada (a elección de desarrollador), comprar una oferta que
	deja un saldo 0 en el contador del comprobador. Y comprobar que el contador se actualiza
	correctamente en la vista del comprador. */
	@Test
	public void PR24() {
		PO_PrivateView.signup(driver, "hector@hotmail.com", "Hector", "Roman", "contraseña123", "contraseña123");			
		PO_OffersView.addOffer(driver,"Objeto de coleccionista","Bapisterio Romano del siglo 1",100.0,false);		
		PO_PrivateView.logout(driver);
		
		PO_PrivateView.signup(driver, "hector2@hotmail.com", "Hector2", "Roman2", "contraseña123", "contraseña123");	
		PO_OffersView.buyOfferByName(driver, "coleccionista");
		
		assertEquals(0.0, PO_PrivateView.getMoney(driver),0.01);	
		
		PO_PrivateView.logout(driver);
	}	
	/**PR25.Sobre una búsqueda determinada (a elección de desarrollador), intentar comprar una
	oferta que esté por encima de saldo disponible del comprador. Y comprobar que se muestra el
	mensaje de saldo no suficiente. */
	@Test
	public void PR25() {
		PO_PrivateView.signup(driver, "penelope@hotmail.com", "penelope", "Roman", "contraseña123", "contraseña123");			
		PO_OffersView.addOffer(driver,"Jersey Gucci","Nuevo",450.0,false);		
		PO_PrivateView.logout(driver);
		
		PO_PrivateView.signup(driver, "penelope2@hotmail.com", "penelope2", "Roman2", "contraseña123", "contraseña123");	
		PO_OffersView.buyOfferByName(driver, "Gucci");
		
		assertEquals(100.0, PO_PrivateView.getMoney(driver),0.01);	
		assertNotNull(PO_View.checkElement(driver, "text", "Error al comprar oferta, no tienes suficiente dinero"));
		
		PO_PrivateView.logout(driver);
	}	
	
	/**PR26. Ir a la opción de ofertas compradas del usuario y mostrar la lista. Comprobar que
	aparecen las ofertas que deben aparecer. */
	@Test
	public void PR26() {
		PO_PrivateView.signup(driver, "cristina@hotmail.com", "Cristina", "Aguilera", "contraseña123", "contraseña123");			
		PO_OffersView.addOffer(driver,"Bolso marron","nuevo bolso coleccion verano",12.0,false);
		PO_OffersView.addOffer(driver,"El principito","edicion nueva libro el principito",8.0,false);	
		PO_PrivateView.logout(driver);
		
		PO_PrivateView.signup(driver, "Jony@hotmail.com", "Jony", "Ruiz", "contraseña123", "contraseña123");	
		PO_OffersView.buyOfferByName(driver, "bolso");
		PO_OffersView.buyOfferByName(driver, "principito");
		
		PO_OffersView.clickOptionWithId(driver, "mCompras", "id");
		assertNotNull(PO_View.checkElement(driver, "text", "El principito"));
		assertNotNull(PO_View.checkElement(driver, "text", "Bolso marron"));
		
		PO_PrivateView.logout(driver);			
	}	
	
	/**PR27. Al crear una oferta marcar dicha oferta como destacada y a continuación comprobar: i)
	que aparece en el listado de ofertas destacadas para los usuarios y que el saldo del usuario se
	actualiza adecuadamente en la vista del ofertante (-20). */
	@Test
	public void PR27() {
		PO_PrivateView.signup(driver, "cristinapedroche@hotmail.com", "Cristina", "Pedroche", "contraseña123", "contraseña123");			
		PO_OffersView.addOffer(driver,"Vestido nochevieja","para las campanadas",120.0,true);
			
		PO_OffersView.clickOptionWithId(driver, "mDestacadas", "id");
		
		assertNotNull(PO_View.checkElement(driver, "text", "Vestido nochevieja"));		
		assertEquals(80.0, PO_PrivateView.getMoney(driver),0.01);
		
		PO_PrivateView.logout(driver);		
	}	
	
	/**PR28. Sobre el listado de ofertas de un usuario con más de 20 euros de saldo, pinchar en el
	enlace Destacada y a continuación comprobar: i) que aparece en el listado de ofertas destacadas
	para los usuarios y que el saldo del usuario se actualiza adecuadamente en la vista del ofertante (-
	20).*/
		@Test
		public void PR28() {
			PO_PrivateView.signup(driver, "pedropica@hotmail.com", "Pedro", "Picapiedra", "contraseña123", "contraseña123");			
			PO_OffersView.addOffer(driver,"Carton de huevos","huevos frescos de corral",4.0,false);
				
			PO_OffersView.highlightOfferByName(driver, "Carton de huevos");
			
			PO_OffersView.clickOptionWithId(driver, "mDestacadas", "id");
			
			assertNotNull(PO_View.checkElement(driver, "text", "Carton de huevos"));		
			assertEquals(80.0, PO_PrivateView.getMoney(driver),0.01);
			
			PO_PrivateView.logout(driver);					
		}
	
	/**PR029. Sobre el listado de ofertas de un usuario con menos de 20 euros de saldo, pinchar en el
		enlace Destacada y a continuación comprobar que se muestra el mensaje de saldo no suficiente. */
	@Test
	public void PR29() {
		PO_PrivateView.signup(driver, "Historia@hotmail.com", "Historia", "Reiss", "contraseña123", "contraseña123");			
		PO_OffersView.addOffer(driver,"3dmsa","equipaje usado",90.0,false);	
		PO_PrivateView.logout(driver);	
		PO_PrivateView.signup(driver, "ymir@hotmail.com", "Ymir", "Fritz", "contraseña123", "contraseña123");
		PO_OffersView.buyOfferByName(driver, "3dmsa");
		
		PO_OffersView.addOffer(driver,"Botas de montaña","para todo tipo de montañas",30.0,false);	
		PO_OffersView.highlightOfferByName(driver, "Botas de montaña");
		
		assertNotNull(PO_View.checkElement(driver, "text", "Error - No tienes suficiente dinero!"));		
		assertEquals(10.0, PO_PrivateView.getMoney(driver),0.01);
		
		PO_PrivateView.logout(driver);			
	}

	//PR030. Sin hacer /
	@Test
	public void PR30() {
		assertTrue("PR30 sin hacer", false);			
	}
	
	//PR031. Sin hacer /
	@Test
	public void PR31() {
		assertTrue("PR31 sin hacer", false);			
	}
	
}