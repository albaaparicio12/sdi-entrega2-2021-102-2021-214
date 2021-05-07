package com.uniovi.tests.pageobjects;

import java.util.List;

import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;


public class PO_OffersView extends PO_NavView{

	public static void addOffer(WebDriver driver, String titulop, String detallesp, double preciop, boolean destacadap) {
		clickOptionWithId(driver, "mAñadir", "id");
		
		WebElement titulo = driver.findElement(By.name("titulo"));
		titulo.click();
		titulo.clear();
		titulo.sendKeys(titulop);
		WebElement detalles = driver.findElement(By.name("detalles"));
		detalles.click();
		detalles.clear();
		detalles.sendKeys(detallesp);
		WebElement precio = driver.findElement(By.name("precio"));
		precio.click();
		precio.clear();
		precio.sendKeys(String.valueOf(preciop));
		if(destacadap) {
			WebElement destacada = driver.findElement(By.name("destacada"));
			destacada.click();
		}
			
		By boton = By.className("btn");
		driver.findElement(boton).click();	
		
	}
	
	static public void deleteOfferByName(WebDriver driver, String oferta) {		
		clickOptionWithId(driver, "mOfertas", "id");		
		clickOptionWithId(driver, "del"+oferta, "id");
	}
	
	static public void deleteOfferByFirstPosition(WebDriver driver) {		
		clickOptionWithId(driver, "mOfertas", "id");
		
		List<WebElement> elementos = driver.findElements(By.xpath("/html/body/div/div/form/table/tbody[1]/tr/th[5]/a"));
		elementos.get(0).click();
	}
	
	static public String getOfferByFirstPosition(WebDriver driver) {		
		clickOptionWithId(driver, "mOfertas", "id");
		
		List<WebElement> elementos = driver.findElements(By.xpath("/html/body/div/div/form/table/tbody[1]/tr/th[1]"));
		return elementos.get(0).getText();
	}
	
	static public void searchOfferByName(WebDriver driver, String offer) {		
		clickOptionWithId(driver, "mTienda", "id");
		
		WebElement barraBusqueda = driver.findElement(By.id("searchBar"));
		barraBusqueda.click();
		barraBusqueda.clear();
		barraBusqueda.sendKeys(offer);
		
		WebElement botonBusqueda = driver.findElement(By.id("searchButton"));
		botonBusqueda.click();
	}
	
	static public int countRowsSearch(WebDriver driver) {		
		clickOptionWithId(driver, "mTienda", "id");
		int offers = 0;
		
		List<WebElement> elementos = PO_View.checkElement(driver, "free", "//a[contains(@class, 'page-link')]");
		for(int i=0;i<elementos.size();i++) {
			elementos.get(i).click();
			offers+=driver.findElements(By.className("row")).size();
		}
		return offers;
	}
	
	static public void buyOfferByName(WebDriver driver, String offer) {		
		searchOfferByName(driver,offer);
		
		List<WebElement> elementos = driver.findElements(By.xpath("/html/body/div/div[2]/div[1]/div/div[2]/div/h5/a"));
		elementos.get(0).click();
	}
	
	static public void highlightOfferByName(WebDriver driver, String offer) {		
		clickOptionWithId(driver, "mOfertas", "id");
		clickOptionWithId(driver, "des"+offer, "id");
	}

}
